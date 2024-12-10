float _hue2rgb(const in float p, const in float q, in float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0 / 2.0) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * 6.0 * (2.0 / 3.0 - t);
  return p;
}

vec3 hsl(const in vec3 hsl) {
  float h = mod(mod(hsl.x, 1.0) + 1.0, 1.0);
  float s = saturate(hsl.y);
  float l = saturate(hsl.z);

  if (s == 0.0) {
    return vec3(l);
  }

  float p = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float q = 2.0 * l - p;
  return vec3(
    _hue2rgb(q, p, h + (1.0/3.0)),
    _hue2rgb(q, p, h),
    _hue2rgb(q, p, h - (1.0/3.0))
  );
}
