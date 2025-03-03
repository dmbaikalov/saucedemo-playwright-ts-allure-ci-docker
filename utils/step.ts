import * as allure from "allure-js-commons";

export function step(stepName?: string) {
  return function decorator(
    tar: Function,
    context: ClassMethodDecoratorContext
  ) {
    return async function replacementMethod(this: any, ...args: any) {
      const className = this.constructor.name;
      const methodName = String(context.name);

      let sName = stepName
        ? stepName.replace("_PageName_", className)
        : `${className}.${methodName}`;
      if (args.length > 0) {
        sName = sName.replace(/\${(.*?)}/g, (_, match) => {
          try {
            return eval(match.replace("0", args[0]));
          } catch (error) {
            return `{${match}}`;
          }
        });
      }
      if (args[0] && typeof args[0] === "object" && args[0]._selector) {
        sName += ` [${args[0]._selector}]`;
      }
      return await allure.step(sName, async (stepContext) => {
        try {
          const result = await tar.apply(this, args);
          stepContext.parameter("Arguments", JSON.stringify(args, null, 2));

          if (result !== undefined) {
            stepContext.parameter("Return Value", JSON.stringify(result));
          }
          stepContext.parameter("Test Name", String(context.name));
          stepContext.parameter("Class Name", className);
          return result;
        } catch (error) {
          stepContext.parameter("Error", error.message);
          throw error;
        }
      });
    };
  };
}
