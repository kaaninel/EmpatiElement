import DOMLCParticle from "./Particles/DOMLCParticle";
import QuerySelectorParticle from "./Particles/QSParticle";
import PropertyParticle from "./Particles/PropertyParticle";
import StageParticle from "./Particles/StageParticle";
import EventParticle from "./Particles/EventParticle";
import EEBase from "./Particles";
import RestParticle from "./Particles/RestParticle";

export class MinimalElement extends PropertyParticle(StageParticle(EEBase)) {}

@RestParticle
@QuerySelectorParticle
@EventParticle
@DOMLCParticle
export default class EmpatiElement extends MinimalElement {}
