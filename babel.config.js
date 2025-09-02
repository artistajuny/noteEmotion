module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // ✅ 이것만 있으면 됨
  };
};
