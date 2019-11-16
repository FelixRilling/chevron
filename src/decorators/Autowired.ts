import { Chevron } from "../Chevron";

/**
 * Decorator function to be used as TypeScript decorator
 * in order to wire an injectable into a class property.
 *
 * @public
 * @param {Chevron} instance Chevron instance to use.
 * @param {*} key Key of the injectable.
 */
const Autowired = <TValue, UInitializer>(
    instance: Chevron<TValue, UInitializer>,
    name: UInitializer | string
) => (target: any, propertyKey: PropertyKey) => {
    target[propertyKey] = instance.get(name);
};

export { Autowired };
