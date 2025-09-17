import { View, ViewProps } from "react-native";

export default function Screen({ style, children, ...rest }: ViewProps & { children?: React.ReactNode }) {
  return <View {...rest} style={[{ flex:1, padding:20, backgroundColor:"#fff" }, style]}>{children}</View>;
}
