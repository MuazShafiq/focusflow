import { Image, StyleSheet } from "react-native";

interface BrandMarkProps {
  size?: number;
}

export const BrandMark = ({ size = 38 }: BrandMarkProps) => {
  return (
    <Image
      accessible={false}
      resizeMode="contain"
      source={require("../../assets/images/focusflow-mark.png")}
      style={[styles.mark, { width: size, height: size }]}
    />
  );
};

const styles = StyleSheet.create({
  mark: {
    flexShrink: 0,
  },
});
