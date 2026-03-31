#extension GL_OES_EGL_image_external : require
precision mediump float;

uniform samplerExternalOES inputTexture;
uniform float uHdrToneMap;

varying vec2 vTexCoord;

vec3 applyHdrToneMap(vec3 color) {
    if (uHdrToneMap < 0.5) {
        return color;
    }

    const float m1 = 0.1593017578125;
    const float m2 = 78.84375;
    const float c1 = 0.8359375;
    const float c2 = 18.8515625;
    const float c3 = 18.6875;
    const float acesA = 2.51;
    const float acesB = 0.03;
    const float acesC = 2.43;
    const float acesD = 0.59;
    const float acesE = 0.14;

    vec3 powered = pow(max(color, vec3(0.0)), vec3(1.0 / m2));
    vec3 numerator = max(powered - vec3(c1), vec3(0.0));
    vec3 denominator = max(vec3(c2) - vec3(c3) * powered, vec3(1e-6));
    vec3 linearHdr = pow(numerator / denominator, vec3(1.0 / m1)) * (10000.0 / 203.0);
    vec3 linearSdr = clamp(
        (linearHdr * (acesA * linearHdr + acesB))
            / (linearHdr * (acesC * linearHdr + acesD) + acesE),
        0.0,
        1.0
    );

    vec3 lower = linearSdr * 12.92;
    vec3 higher = 1.055 * pow(max(linearSdr, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
    vec3 cutoff = step(vec3(0.0031308), linearSdr);
    return mix(lower, higher, cutoff);
}

void main() {
    vec3 color = texture2D(inputTexture, vTexCoord).rgb;
    gl_FragColor = vec4(applyHdrToneMap(color), 1.0);
}
