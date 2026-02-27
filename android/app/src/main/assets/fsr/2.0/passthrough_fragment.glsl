#extension GL_OES_EGL_image_external : require
precision mediump float;

uniform samplerExternalOES inputTexture;
uniform float uHdrToneMap;

varying vec2 vTexCoord;

vec3 applyHdrToneMap(vec3 color) {
    if (uHdrToneMap < 0.5) {
        return color;
    }
    vec3 linear = pow(max(color, vec3(0.0)), vec3(2.0));
    vec3 mapped = linear / (linear + vec3(1.0));
    vec3 srgb = pow(mapped, vec3(0.5));
    return mix(color, srgb, clamp(0.5, 0.0, 1.0));
}

void main() {
    vec3 color = texture2D(inputTexture, vTexCoord).rgb;
    gl_FragColor = vec4(applyHdrToneMap(color), 1.0);
}
