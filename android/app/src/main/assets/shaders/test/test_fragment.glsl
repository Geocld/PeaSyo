#version 300 es

#extension GL_OES_EGL_image_external : require
precision highp float;

// External texture containing video decoder output.
uniform samplerExternalOES inputTexture;

in vec2 vTexCoord;
out vec4 FragColor;

void main() {
  // 采样纹理
  FragColor = texture(inputTexture, vTexCoord);
}