import { Chevron } from "../../src/Chevron";
import { DefaultBootstrappers } from "../../src/bootstrap/DefaultBootstrappers";

describe("Chevron ITs", () => {
    it("Asserts that an error is thrown when resolving circular dependencies", () => {
        const cv = new Chevron();
        const result = 123;

        const testFactoryName = "testFactoryName";
        const testServiceName = "testServiceName";

        const testServiceFn: () => number = () => result;
        cv.register(
            testServiceFn,
            DefaultBootstrappers.FUNCTION,
            [testFactoryName],
            testServiceName
        );

        class TestFactoryClass {
            private readonly numberService: () => number;

            public constructor(numberService: () => number) {
                this.numberService = numberService;
            }

            public getVal(): number {
                return this.numberService();
            }
        }

        cv.register(
            TestFactoryClass,
            DefaultBootstrappers.CLASS,
            [testServiceName],
            testFactoryName
        );

        expect(() => cv.get(testFactoryName)).toThrowError(
            /Circular dependencies found.+/
        );
    });
});
