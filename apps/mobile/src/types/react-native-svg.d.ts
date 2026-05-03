// Type fix for react-native-svg with React 19
// React 19 removed context, setState, forceUpdate from Component type

declare module "react-native-svg" {
  import React from "react";
  import { ViewProps } from "react-native";

  type SvgComponent<T> = React.ComponentClass<T> | React.FunctionComponent<T>;

  export interface SvgProps extends ViewProps {
    viewBox?: string;
    preserveAspectRatio?: string;
    width?: number | string;
    height?: number | string;
    color?: string;
  }

  export const Svg: SvgComponent<SvgProps>;
  export const Path: SvgComponent<PathProps>;
  export const Circle: SvgComponent<CircleProps>;
  export const G: SvgComponent<GProps>;
  export const Rect: SvgComponent<RectProps>;
  export const Text: SvgComponent<TextProps>;
  export const Line: SvgComponent<LineProps>;
  
  export interface PathProps extends SvgProps {
    d?: string;
    fill?: string;
    stroke?: string;
  }
  
  export interface CircleProps extends SvgProps {
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
    fill?: string;
  }
  
  export interface GProps extends SvgProps {}
  
  export interface RectProps extends SvgProps {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    fill?: string;
  }
  
  export interface TextProps extends SvgProps {
    x?: number | string;
    y?: number | string;
    textAnchor?: string;
    fill?: string;
  }
  
  export interface LineProps extends SvgProps {
    x1?: number | string;
    y1?: number | string;
    x2?: number | string;
    y2?: number | string;
    stroke?: string;
  }
}
