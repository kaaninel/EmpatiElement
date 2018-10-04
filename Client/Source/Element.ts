import DOMLCParticle from "./Particles/DOMLCParticle";
import QuerySelectorParticle from "./Particles/QSParticle";
import PropertyParticle from "./Particles/PropertyParticle";
import StageParticle from "./Particles/StageParticle";
import EventParticle from "./Particles/EventParticle";
import EEBase from "./Particles";

export class MinimalElement extends PropertyParticle(StageParticle(EEBase)) {
}


@QuerySelectorParticle
@EventParticle
@DOMLCParticle
export default class EmpatiElement extends MinimalElement {}

