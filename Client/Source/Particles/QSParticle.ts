import EEBase, { Constructor } from "../Particles";

const MinimalQSI = QuerySelectorParticle(EEBase);
export type MinimalQS = typeof MinimalQSI;

export function Query(Selector: string){  
  return function (Target: any, Key: string) {
    if(!("Queries" in Target)) Target.Queries = {};
    (Target as MinimalQS).Queries[Key] = Selector;
  }
}

export function QueryAll(Selector: string){
  return function (Target: any, Key: string) {
    if(!("AllQueries" in Target)) Target.AllQueries = {};
    (Target as MinimalQS).AllQueries[Key] = Selector;
  }
}

export default function QuerySelectorParticle<TBase extends Constructor<EEBase>>(Ctor: TBase){
  return class QSParticleP extends Ctor {
    static Queries: Record<string, string>;
    static AllQueries: Record<string, string>;

    constructor(...args: any[]) {
      super(...args);
      if ("Queries" in this.Proto)
        for (const Key in this.Proto.Queries)
          Object.defineProperty(this, Key, {
            get() {
              return this.Root.querySelector(
                (this.Proto as typeof QSParticleP).Queries[Key]
              );
            }
          });
      if ("AllQueries" in this.Proto)
        for (const Key in this.Proto.AllQueries)
          Object.defineProperty(this, Key, {
            get() {
              return Array.from(
                this.Root.querySelectorAll(
                  (this.Proto as typeof QSParticleP).AllQueries[Key]
                )
              );
            }
          });
    }
  };
}
