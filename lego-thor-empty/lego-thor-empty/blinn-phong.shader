
attribute vec3      a_Position;
attribute vec3      a_Normal;
attribute vec2      a_TexCoord;

varying   vec2      v_TexCoord;
varying   vec3      v_Normal;
varying   vec3      v_Position;

uniform   vec3      u_Color;
uniform   vec3      u_SpecColor;
uniform   float     u_SpecExp;
uniform   float     u_Texture;
uniform   sampler2D u_Sampler;

uniform   vec3      u_LightColor;
uniform   vec3      u_LightDirection;
uniform   float     u_LightAmbient;

uniform   mat4      u_MMatrix;
uniform   mat4      u_VMatrix;
uniform   mat4      u_PMatrix;
uniform   mat4      u_NMatrix;

////////////////

void main() {
    vec4 v = u_VMatrix * u_MMatrix * vec4(a_Position, 1.0);
    vec4 n = u_NMatrix * vec4(a_Normal, 0);
    
    gl_Position = u_PMatrix * v;
    v_TexCoord  = a_TexCoord;
    v_Normal    = normalize(n.xyz);
    v_Position  = v.xyz / v.w;
}


//////////////////

// http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// blinn-phong specular reflection
vec3 blinnphong(vec3 viewdir, vec3 normal, vec3 lightdir, vec3 lightcol, vec3 matspecular, float matspecexp) {
    vec3  halfdir  = normalize(viewdir + lightdir);
    float specAng  = max(dot(halfdir, normal),0.0);
    //float specAng  = abs(dot(halfdir, normal));
    float specular = pow(specAng, matspecexp);
    return matspecular * lightcol * specular;
}


void main() {
    vec4 tex = texture2D(u_Sampler, v_TexCoord);
    vec4 color = vec4(u_Color, 1.0) * (1.0-u_Texture) + u_Texture * tex * vec4(u_Color, 1.0);
    
    float nDotL  = max(dot(u_LightDirection, v_Normal), 0.0);
    //float nDotL  = abs(dot(u_LightDirection, v_Normal));
    vec3 viewdir = normalize(-v_Position);
    
    // compute diffuse
    vec3 diffuse = u_LightColor * color.xyz * nDotL;
    
    // compute ambient
    vec3 ambient = u_LightColor * color.xyz * u_LightAmbient;
    
    // compute specular
    vec3 specular = blinnphong(viewdir, v_Normal, u_LightDirection, u_LightColor, u_SpecColor, u_SpecExp) * 2.0;
    
    gl_FragColor = vec4(diffuse + ambient + specular, 1.0);
}

