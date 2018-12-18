/* tslint:disable:max-classes-per-file */
import { Chevron } from "../../src/Chevron";
import { Injectable } from "../../src/decorators/Injectable";
import { InjectableType } from "../../src/injectableTypes/InjectableType";
import { Autowired } from "../../src/decorators/Autowired";

describe("Injectable tests", () => {
    it("Asserts that @Injectable works", () => {
        const cv = new Chevron();
        const result = 123;

        const testFactoryName = "testFactoryName";

        @Injectable(cv, InjectableType.FACTORY, [], testFactoryName)
        class TestFactoryClass {
            public getVal() {
                return result;
            }
        }

        expect(cv.get(testFactoryName).getVal()).toBe(result);
    });

    it("Asserts that @Injectable can interfere the name", () => {
        const cv = new Chevron();

        const result = 123;

        @Injectable(cv, InjectableType.FACTORY, [])
        class TestFactoryClass {
            public getVal() {
                return result;
            }
        }

        class ConsumerClass {
            @Autowired(cv, TestFactoryClass)
            private readonly injectedDependency: any;

            public getVal() {
                return this.injectedDependency.getVal();
            }
        }

        expect(new ConsumerClass().getVal()).toBe(result);
    });
});
