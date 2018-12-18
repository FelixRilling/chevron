import { Chevron } from "../Chevron";
import { dependencyDefinitionArr } from "../dependencyDefinitionArr";
import { InjectableType } from "../injectableTypes/InjectableType";

/**
 * Decorator function to be used with TypeScript decorators
 * in order to declare a value to be an injectable which is added to the chevron instance.
 *
 * This is not exported with the main JS files as it only is useful with TypeScript.
 *
 * @param {Chevron} instance Chevron instance to use.
 * @param {string} type Type of the injectable.
 * @param {string[]} dependencies Array of dependency names.
 * @param {*?} key Key of the injectable. If not set, the name will be inferred from the content.
 * @example
 * const cv = new Chevron();
 *
 * @Injectable(cv, InjectableType.FACTORY, [])
 * class TestFactoryClass {
 *   public getVal() {
 *     return 123;
 *   }
 * }
 *
 * class ConsumerClass {
 *   @Autowired(cv, TestFactoryClass)
 *   private readonly injectedDependency: any;
 *
 *   public getVal() {
 *     return this.injectedDependency.getVal();
 *   }
 * }
 *
 * @example
 * const cv = new Chevron();
 *
 * const testFactoryName = "testFactoryName";
 * @Injectable(cv, InjectableType.FACTORY, [], testFactoryName)
 * class TestFactoryClass {
 *   public getVal() {
 *     return 123;
 *   }
 * }
 *
 * class ConsumerClass {
 *   @Autowired(cv, testFactoryName)
 *   private readonly injectedDependency: any;
 *
 *   public getVal() {
 *     return this.injectedDependency.getVal();
 *   }
 * }
 */
const Injectable = (
    instance: Chevron,
    type: InjectableType,
    dependencies: dependencyDefinitionArr,
    key?: any
) => (target: any) => {
    instance.set(type, dependencies, target, key);
    return target;
};

export { Injectable };
