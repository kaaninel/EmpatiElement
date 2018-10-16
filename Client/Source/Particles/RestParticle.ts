import EEBase, { Constructor } from "../Particles";

export function Request(Ep: string, Data?: any) {
  return function(Target: any, Key: string) {
    if (!("Requests" in Target)) Target.Requests = [];
    (Target as typeof MinimalRest).Requests.push({
      Ep,
      Data,
      Key
    });
  };
}

export function Bind(Event: string) {
  return function(Target: any, Key: string) {
    if (!("Bindings" in Target)) Target.Bindings = [];
    (Target as typeof MinimalRest).Bindings.push({ Event, Key });
  };
}
const MinimalRest = RestParticle(EEBase);

export default function RestParticle<TBase extends Constructor<EEBase>>(
  Ctor: TBase
) {
  return class RestParticleP extends Ctor {
    static Requests: { Ep: string; Data: any; Key: string }[];
    static Bindings: { Key: string; Event: string }[];

    constructor(...args: any[]) {
      super(...args);
      if ("Requests" in this.Proto)
        for (const Req of (this.Proto as typeof MinimalRest).Requests) {
          //@ts-ignore
          this["$Request" + Req.Key] = () => {
            const Data =
              Req.Data && Req.Data.constructor == Function
                ? Req.Data.call(this)
                : Req.Data;
            //@ts-ignore
            this[Req.Key] = fetch(Req.Ep, {
              body: Data,
              method: Req.Data ? "POST" : "GET",
              credentials: "same-origin"
            }).then(x => x.json());
          };
          //@ts-ignore
          this["$Request" + Req.Key]();
        }
      if ("Bindings" in this.Proto)
        for (const Bind of (this.Proto as typeof MinimalRest).Bindings) {
          if ("$Request" + Bind.Key in this)
            this.addEventListener(
              Bind.Event,
              //@ts-ignore
              this["$Request" + Bind.Key].bind(this)
            );
        }
    }
  };
}
