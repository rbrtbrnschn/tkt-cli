import { Args, Command, Flags } from "@oclif/core";
import * as fs from "fs";
import * as path from "path";

export default class Generate extends Command {
  static description = "generate components from templates";
  static aliases: string[] = ["g"];
  static examples = [
    `$ create-component g my-component
    Generating component 'my-component'! (./src/commands/create-component/index.ts)`,
  ];

  static flags = {
    addTypesFile: Flags.boolean({
      char: "t",
      description: "add component.types.ts",
      required: false,
    }),
    addConstsFile: Flags.boolean({
      char: "c",
      description: "add component.consts.ts",
      required: false,
    }),
    addStylesFile: Flags.boolean({
      char: "s",
      description: "add component.styles.ts",
      required: false,
    }),
    addGraphqlFile: Flags.boolean({
      char: "g",
      description: "add component.graphql.ts",
      required: false,
    }),
    addPartsFolder: Flags.boolean({
      char: "p",
      description: "add ./parts/ folder",
      required: false,
    }),
    screenOverComponentSuffix: Flags.boolean({
      char: "S",
      description: "create a .screen.tsx rather than .component.tsx",
      required: false,
    }),
    useDefaults: Flags.boolean({
      char: "d",
      description: "create all available files",
      required: false,
    }),
  };

  static args = {
    componentName: Args.string({ name: "component name", required: true }),
  };
  public async run(): Promise<void> {
    const {
      args: { componentName },
      flags: {
        addConstsFile,
        addPartsFolder,
        addStylesFile,
        addTypesFile,
        screenOverComponentSuffix,
        useDefaults,
        addGraphqlFile,
      },
    } = await this.parse(Generate);
    const CWD = process.cwd();

    const needFile = (boo?: boolean): boolean => {
      if (boo || useDefaults) return true;
      return false;
    };
    const files: File[] = [];
    files.push({
      name: `${componentName}.${
        screenOverComponentSuffix ? "screen" : "component"
      }.tsx`,
      template: (componentName) =>
        `
      import React from "react";
      ${
        needFile(addTypesFile)
          ? `import { ${TransformComponentName.toPropsName(
              componentName
            )} } from "${TransformComponentName.toImportPath(
              componentName + ".types"
            )}";`
          : ""
      }

      export const ${kebabToCamelCase(componentName)} = ({...props}: ${
          needFile(addTypesFile)
            ? kebabToCamelCase(componentName) + "Props"
            : "any"
        }) => {
        return <div></div>;
      }
      `,
    });
    needFile(addTypesFile) &&
      files.push({
        name: `${componentName}.types.ts`,
        template: (componentName) => `
        export type ${TransformComponentName.toPropsName(componentName)} = {}
        `,
      });
    needFile(addStylesFile) &&
      files.push({
        name: `${componentName}.styles.tsx`,
        template: () => "",
      });
    needFile(addConstsFile) &&
      files.push({
        name: `${componentName}.consts.ts`,
        template: () => "",
      });

    needFile(addGraphqlFile) &&
      files.push({
        name: `${componentName}.graphql.ts`,
        template: () => `
          import { graphql } from "babel-plugin-relay/macro";
          `,
      });

    files.push({
      name: "index.ts",
      template: () =>
        `export * from "${TransformComponentName.toImportPath(componentName)}.${
          screenOverComponentSuffix ? "screen" : "component"
        }"`,
    });

    try {
      fs.mkdirSync(path.join(CWD, componentName));
      files.map((file) => {
        fs.writeFileSync(
          path.join(CWD, componentName, file.name),
          file.template(componentName),
          { encoding: "utf-8" }
        );
      });
      !!addPartsFolder && fs.mkdirSync(path.join(CWD, componentName, "parts"));

      this.log(`written files to ${CWD}/${componentName}`);
    } catch (e) {
      console.log("e", e);
      this.log(`error occured`);
    } finally {
    }
  }
}

type File = {
  name: string;
  template: (componentName: string) => string;
};
function kebabToCamelCase(input: string): string {
  return input
    .toLowerCase()
    .split("-")
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      } else {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
    })
    .join("");
}
const TransformComponentName = {
  toPascalCase: (componentName: string) =>
    componentName
      .toLowerCase()
      .split("-")
      .map((word, index) => {
        if (index === 0) {
          // Capitalize the first word
          return word.charAt(0).toUpperCase() + word.slice(1);
        } else {
          // Capitalize the first character of each subsequent word
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
      })
      .join(""),
  toImportPath: (input: string) => `./${input}`,
  toPropsName: (componentName: string) =>
    `${TransformComponentName.toPascalCase(componentName)}Props`,
};
