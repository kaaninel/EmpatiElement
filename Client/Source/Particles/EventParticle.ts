import EEBase, { Constructor } from "../Particles";

export const IESTarget = new EventTarget();

type EventTargets = EEBase | string | Window;

export function Event(
  Event: string,
  Host?: ((E: EEBase) => EventTargets) | EventTargets
) {
  return function(Target: any, Key: string) {
    if (!("Events" in Target)) Target.Events = [];
    //@ts-ignore
    (Target as typeof EEBase).Events.push({
      Event,
      Host,
      Func: Target[Key]
    });
  };
}

export function IEvent(Event: string) {
  return function(Target: any, Key: string) {
    if (!("IEvents" in Target)) Target.IEvents = [];
    //@ts-ignore
    (Target as typeof EEBase).IEvents.push({
      Event,
      Func: Target[Key]
    });
  };
}

export default function EventParticle<TBase extends Constructor<EEBase>>(
  Ctor: TBase
) {
  return class EventParticleP extends Ctor {
    static Events: Array<{
      Host: ((E: EEBase) => EventTargets) | EventTargets
      Event: string;
      Func: Function;
    }>;
    static IEvents: Array<{
      Event: string;
      Func: Function;
    }>;
    Events: Array<{
      Host: ((E: EEBase) => EventTargets) | EventTargets
      Event: string;
      Func: Function;
      HookedHost: any;
    }>;

    constructor(...args: any[]) {
      super(...args);
      const Proto = this.Proto as typeof EventParticleP;
      const Self = this;
      if ("Events" in Proto){
        this.Events = Proto.Events.map(x => ({
          Event: x.Event,
          Host: x.Host || this,
          Func: function(Event: any){
            return x.Func.call(Self, Event, this);
          },
          HookedHost: undefined
        }));
      }
      if ("IEvents" in this.Proto)
        (this.Proto as typeof EventParticleP).IEvents.forEach(x => {
          IESTarget.addEventListener(x.Event, x.Func.bind(this));
        });
    }

    Rendered(){
      //@ts-ignore
      if(super.Rendered) super.Rendered();
      if(this.Events) {
        for(const Event of this.Events){
          const CHost = Event.Host.constructor == Function ? 
            (Event.Host as Function).call(this) : Event.Host;
          const ShouldHook = CHost != Event.HookedHost;
          if(CHost.constructor === String || ShouldHook){
            if(!!Event.HookedHost) 
              this.$ResolveEventTargets(Event.HookedHost).forEach(Element => {
                Element.removeEventListener(Event.Event, Event.Func as any);
              });
            this.$ResolveEventTargets(CHost).forEach(Element => {
              Element.addEventListener(Event.Event, Event.Func as any);
            });
            Event.HookedHost = CHost;
          }
        }
      }
    }

    $ResolveEventTargets(HostQ: EventTargets): HTMLElement[]{
      if(HostQ.constructor === String)
        return Array.from((this.Root as ShadowRoot)
          .querySelectorAll(HostQ as string));
          //@ts-ignore
      else return HostQ instanceof Array ? HostQ : [HostQ];
    }

    Dispatch(Key: string, Data: any) {
      this.dispatchEvent(new CustomEvent(Key, { detail: Data }));
    }
  };
}
