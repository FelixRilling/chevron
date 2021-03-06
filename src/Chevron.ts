import { name as getName } from "lightdash";
import { InjectableEntry } from "./injectable/InjectableEntry";
import { InjectableOptions } from "./injectable/InjectableOptions";
import { DefaultFactory } from "./factory/DefaultFactory";
import { DefaultScope } from "./scope/DefaultScope";
import { Nameable } from "./injectable/Nameable";

/**
 * Tries to guess the string name of a nameable value. if none can be determined, an error is thrown.
 * See {@link Nameable} and {@link getName} for details.
 *
 * @private
 * @param value Value to to guess a name for.
 * @return Name of the value.
 * @throws TypeError when to name can be guessed.
 */
const guessName = (value: any): string => {
    const guessedName = getName(value);
    if (guessedName == null) {
        throw new TypeError(
            `Could not guess name of '${String(
                value
            )}', please explicitly define one.`
        );
    }
    return guessedName;
};

/**
 * Creates an error circular injectable dependencies.
 *
 * @private
 * @param resolveStack Resolve stack.
 * @param injectableEntryName Current injectable name that caused the error.
 * @return Created error
 */
const createCircularDependencyError = (
    resolveStack: Set<string>,
    injectableEntryName: string
): Error => {
    const resolveStackFull = [...Array.from(resolveStack), injectableEntryName];
    const stackVisualization = resolveStackFull
        .map((name) => `'${name}'`)
        .join(" -> ");
    return new Error(`Circular dependencies found: ${stackVisualization}.`);
};

/**
 * Helper interface for {@link Chevron#resolveInjectableInstance} lookups.
 *
 * @private
 */
interface ResolvedInstance<TInstance, UInitializer, VDependency, WContext> {
    injectableEntry: InjectableEntry<
        TInstance,
        UInitializer,
        VDependency,
        WContext
    >;
    instanceName: string | null;
}

/**
 * Injectable container class.
 *
 * @public
 * @class
 * @typeparam TContext type of the context which cane be used for scoping.
 */
class Chevron<TContext> {
    // TODO: find a way to avoid using any here.
    private readonly injectables: Map<
        string,
        InjectableEntry<any, any, any, TContext | null>
    >;

    /**
     * Creates a new, empty container.
     *
     * @public
     */
    public constructor() {
        this.injectables = new Map();
    }

    /**
     * Registers a new injectable on this container.
     *
     * @public
     * @param initializer Initial value of this injectable. This can be any value, but usually  a class or a different kind of function.
     *      During retrieval, the initial value might be transformed by the factory (see {@link Factory} for details).
     *      If no name is provided in the options (see description of the options parameter, section "name"),
     *      a name will be determined from the initializer through {@link getName}.
     *      or a value which is nameable. For details on nameable values see {@link getName}.
     * @param options Options for this injectable. The following options exist:
     *      <ul>
     *          <li>name:
     *                  Name for this injectable. If this is not provided, the name will be determined based on the initializer.
     *                  (see description of the initializer parameter)
     *          </li>
     *          <li>factory:
     *                  Instantiation strategy to use when instantiating this injectable (see {@link Factory} for details).
     *                  By default, {@link DefaultFactory.IDENTITY} is used. If your injectable is a class or factory function,
     *                  consider using {@link DefaultFactory.CLASS} or {@link DefaultFactory.FUNCTION} instead respectively,
     *                  or provide your own.
     *          </li>
     *          <li>scope:
     *                  Scoping strategy to use when retrieving instances (see {@link Scope} for details).
     *                  By default, {@link DefaultScope.SINGLETON} is used. For different use cases,
     *                  see {@link DefaultScope.PROTOTYPE} or provide your own.
     *          </li>
     *      </ul>
     * @typeparam TInstance type a constructed instance will have.
     * @typeparam UInitializer type of the provided initializer.
     * @typeparam VDependency should not be set explicitly usually. Type of the dependencies used by this injectable.
     * @throws Error when an injectable with the requested name is already registered.
     * @throws TypeError when no name can be determined for this injectable or any of its dependencies.
     */
    public registerInjectable<TInstance, UInitializer, VDependency = any>(
        initializer: UInitializer,
        options: InjectableOptions<
            TInstance,
            UInitializer,
            VDependency,
            TContext | null
        > = {}
    ): void {
        const factory =
            options.factory ??
            DefaultFactory.IDENTITY<
                UInitializer,
                UInitializer,
                VDependency,
                TContext | null
            >();
        const scope =
            options.scope ?? DefaultScope.SINGLETON<TContext | null>();
        const name = options.name ?? null;
        const dependencies = options.dependencies ?? [];

        const injectableEntryName =
            name != null ? guessName(name) : guessName(initializer);

        if (this.injectables.has(injectableEntryName)) {
            throw new Error(`Name already exists: '${injectableEntryName}'.`);
        }

        this.injectables.set(injectableEntryName, {
            initializer,
            factory,
            scope,
            dependencyNames: dependencies.map((dependencyName) =>
                guessName(dependencyName)
            ),
            instances: new Map(),
        });
    }

    /**
     * Checks if an injectable with the name provided is registered for this container, regardless if its instantiated or not.
     * To check if an injectable is registered and instantiated, see {@link #hasInjectableInstance}.
     *
     * @public
     * @param name Either a raw string name or a nameable value that should be checked for. See {@link #registerInjectable} for details.
     * @return if an injectable with the name provided is registered on this container.
     * @throws TypeError when no name can be determined for the provided nameable.
     */
    public hasInjectable(name: Nameable): boolean {
        return this.injectables.has(guessName(name));
    }

    /**
     * Checks if an injectable with the name provided is registered and instantiated for this container.
     * To check if an injectable is registered without checking for instantiation, see {@link #hasInjectable}.
     *
     * @public
     * @param name Either a raw string name or a nameable value that should be checked for. See {@link #registerInjectable} for details.
     * @param context Context to be used for instance checks. See {@link Scope} for details.
     * @return if an injectable with the name provided is registered and instantiated on this container.
     * @throws TypeError when no name can be determined for the provided nameable.
     */
    public hasInjectableInstance(
        name: Nameable,
        context: TContext | null = null
    ): boolean {
        if (!this.hasInjectable(name)) {
            return false;
        }

        const {
            injectableEntry,
            instanceName,
        } = this.resolveInjectableInstance(guessName(name), context);

        return (
            instanceName != null && injectableEntry.instances.has(instanceName)
        );
    }

    /**
     * Retrieves an instantiated injectable, recursively instantiating dependencies if they were not instantiated before.
     *
     * @public
     * @param name Either a raw string name or a nameable value that should be retrieved. See {@link #registerInjectable} for details.
     * @param context Context to be used for instance checks. See {@link Scope} for details.
     * @return instantiated injectable for the given name.
     * @throws TypeError when no name can be determined for the provided nameable.
     * @throws Error when the injectable or a dependency cannot be found.
     * @throws Error when recursive dependencies are detected.
     * @typeparam TInstance type a constructed instance will have.
     */
    public getInjectableInstance<TInstance>(
        name: Nameable,
        context: TContext | null = null
    ): TInstance {
        return this.accessInjectableInstance(
            guessName(name),
            context,
            new Set()
        );
    }

    /**
     * Resolves an injectable by name, providing information about the injectable entry, its name and scope value.
     *
     * @private
     * @param injectableEntryName Raw string name of the injectable.
     * @param context Context to be used for instance checks. See {@link Scope} for details.
     * @return data object containing the injectable entry, its name and scope value.
     * @throws Error if no injectable for the name is found.
     */
    private resolveInjectableInstance<TInstance, UInitializer>(
        injectableEntryName: string,
        context: TContext | null
    ): ResolvedInstance<TInstance, UInitializer, unknown, TContext | null> {
        if (!this.injectables.has(injectableEntryName)) {
            throw new Error(
                `Injectable '${injectableEntryName}' does not exist.`
            );
        }

        const injectableEntry = this.injectables.get(injectableEntryName)!;
        const instanceName = injectableEntry.scope(
            context,
            injectableEntryName
        );
        return {
            injectableEntry,
            instanceName,
        };
    }

    /**
     * Retrieves an instantiated injectable, recursively instantiating dependencies if they were not instantiated before.
     *
     * @private
     * @param injectableEntryName Raw string name of the injectable.
     * @param context Context to be used for instance checks. See {@link Scope} for details.
     * @param resolveStack Stack of previously requested instantiations. used to detect circular dependencies.
     * @return instantiated injectable for the given name.
     * @throws Error if no injectable for the name is found.
     * @throws Error when a dependency cannot be found.
     * @throws Error when recursive dependencies are detected.
     */
    private accessInjectableInstance<TInstance>(
        injectableEntryName: string,
        context: TContext | null,
        resolveStack: Set<string>
    ): TInstance {
        const {
            injectableEntry,
            instanceName,
        } = this.resolveInjectableInstance(injectableEntryName, context);

        if (
            instanceName != null &&
            injectableEntry.instances.has(instanceName)
        ) {
            return <TInstance>injectableEntry.instances.get(instanceName)!;
        }

        // Start instantiating value.
        if (resolveStack.has(injectableEntryName)) {
            throw createCircularDependencyError(
                resolveStack,
                injectableEntryName
            );
        }
        resolveStack.add(injectableEntryName);

        // Collect all dependencies, instantiating those which are not already in the process.
        const instantiatedDependencies = injectableEntry.dependencyNames.map(
            (dependencyName) =>
                this.accessInjectableInstance(
                    dependencyName,
                    null, // Do not delegate context
                    resolveStack
                )
        );
        const instance = injectableEntry.factory(
            injectableEntry.initializer,
            instantiatedDependencies,
            context,
            injectableEntryName
        );
        // A name of "null" means that the instance should not be cached, skip saving it.
        if (instanceName != null) {
            injectableEntry.instances.set(instanceName, instance);
        }

        resolveStack.delete(injectableEntryName);

        return <TInstance>instance;
    }
}

export { Chevron };
