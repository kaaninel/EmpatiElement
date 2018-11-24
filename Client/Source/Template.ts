import { TemplateResult, defaultTemplateProcessor } from "./Lit/lit-html";

class EmpatiTemplate extends TemplateResult {
  constructor(strings: TemplateStringsArray, values: any[]) {
    super(strings, values, "html", defaultTemplateProcessor);
  }

  getHTML() {
    const SelfClosing = super.getHTML().split("/>");
    for (let i = 0; i < SelfClosing.length - 1; i++) {
      const x = SelfClosing[i];
      let SignIndex = x.lastIndexOf("<");
      let IsSignValid = false;
      while (!IsSignValid) {
        const signature = x.substr(SignIndex + 1);
        const QMatch = signature.match(/"/g);
        if (QMatch) {
          if (QMatch.length % 2 === 0) {
            IsSignValid = true;
          } else {
            SignIndex = x.substr(SignIndex).lastIndexOf("<");
          }
        } else {
          IsSignValid = true;
        }
      }
      const TagMatch = x.substr(SignIndex + 1).match(/[\w-]+/);
      if (TagMatch) {
        SelfClosing[i] = `${x}></${TagMatch[0]}>`;
      }
    }
    return SelfClosing.join("");
  }
}

class EmpatiStyle extends TemplateResult {
  constructor(strings: TemplateStringsArray, values: any[]) {
    super(strings, values, "html", defaultTemplateProcessor);
  }
}

export const html = (strings: TemplateStringsArray, ...values: any[]) =>
  new EmpatiTemplate(strings, values);

export const css = (strings: TemplateStringsArray, ...values: any[]) =>
  new EmpatiStyle(strings, values);
  
