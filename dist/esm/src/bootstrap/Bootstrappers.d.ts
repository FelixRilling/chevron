declare const Bootstrappers: {
    CLASS: <TValue, UInitializer, VDependency>(initializer: UInitializer, dependencies: VDependency[]) => TValue;
    FUNCTION: <TValue_1, UInitializer_1, VDependency_1>(initializer: UInitializer_1, dependencies: VDependency_1[]) => (...args: any[]) => any;
    IDENTITY: <TInitializer>(initializer: TInitializer) => TInitializer;
};
export { Bootstrappers };
//# sourceMappingURL=Bootstrappers.d.ts.map