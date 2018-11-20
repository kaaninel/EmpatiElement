import EEBase, { Constructor } from "../Particles";

type EPType = string | ((E: EEBase) => string);

export function Request(Ep: EPType, Data?: any) {
  return function(Target: any, Key: string) {
    if (!("Requests" in Target)) Target.Requests = [];
    (Target as typeof MinimalRest).Requests.push({
      Ep,
      Data,
      Key
    });
  };
}

const MinimalRest = RestParticle(EEBase);

export default function RestParticle<TBase extends Constructor<EEBase>>(
  Ctor: TBase
) {
  return class RestParticleP extends Ctor {
    static Requests: { Ep: EPType; Data: any; Key: string }[];
    static Bindings: { Key: string; Event: string }[];

    Requests: { Ep: EPType; Data: any; Key: string }[] = [];

    RefreshRequest(Key: string, Ep: string, Data: any){
      const body = Data && JSON.stringify(Data);
      const method = Data ? "POST" : "GET";
      const El = (this as any)[Key];
      if(El && El.Ep == Ep && El.Data == Data) return;
      const R = (this as any)[Key] = fetch(Ep, {
        body,
        method,
        credentials: "same-origin"
      }).then(x => x.json());   
      (this as any)[Key].Ep = Ep;
      (this as any)[Key].Data = Data; 
    }

    constructor(...args: any[]) {
      super(...args);
      if ("Requests" in this.Proto)
        (this.Proto as typeof MinimalRest).Requests.map(Req => {
          const IsStatic = Req.Ep.constructor !== Function;
          const IsStaticData = !Req.Data || Req.Data && Req.Data.constructor !== Function;
          if(IsStatic && IsStaticData)
            this.RefreshRequest(Req.Key, Req.Ep as string, Req.Data);
          else if (IsStatic)
            this.Requests.push(Req); 
          else 
            this.Requests.push({Key: Req.Key, Ep: (Req.Ep as Function).
              bind(null, this), Data: Req.Data});
        });
    }

    Rendered(){
      //@ts-ignore
      if(super.Rendered) super.Rendered();
      this.Requests.forEach(x => {
        const Ep = x.Ep.constructor === String ? x.Ep : (x.Ep as Function)();
        const Data = x.Data && x.Data.constructor === Function ? x.Data.call(this) : x.Data;
        this.RefreshRequest(x.Key, Ep, Data);
      });
      
    }
  };
}
