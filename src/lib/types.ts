export type UIComponentNode = {
  name: string;
  purpose: string;
  tailwindClasses: string;
  props?: Record<string, string | boolean | number>;
  children?: UIComponentNode[];
};

export type UIGenerationResult = {
  appName: string;
  description: string;
  componentTree: UIComponentNode;
  generatedCode: string;
};
