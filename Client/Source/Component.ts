import EmpatiElement from "./Element";

export default class EmpatiComponent extends EmpatiElement {

  Root: ShadowRoot;

  protected CreateRoot(): ShadowRoot {
    return this.attachShadow({ mode: "open" });
  }

}