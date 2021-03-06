#version 330 core

// Interpolated values from the vertex shaders
in vec2 UV;
in vec3 Position_worldspace;
in vec3 Normal_cameraspace;
in vec3 EyeDirection_cameraspace;
in vec3 LightDirection_cameraspace;
in vec4 ShadowCoord;


layout (location = 0) out vec4 FragColor;
layout (location = 1) out vec4 BrightColor;  

// Values that stay constant for the whole mesh.
uniform sampler2D myTextureSampler;
uniform mat4 MV;
uniform vec3 LightPosition_worldspace;
uniform int hasTexture;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform sampler2DShadow shadowMap;

uniform int enableLighting;
uniform int enableGlow;
uniform int enableTransparency;
uniform float alpha;

vec2 disk[16] = vec2[]( 
   vec2( -0.94202634, -0.39907226 ), 
   vec2( 0.94558508, -0.76891735 ), 
   vec2( -0.094184211, -0.92938780 ), 
   vec2( 0.34495848, 0.29387650 ), 
   vec2( -0.91588491, 0.45771522 ), 
   vec2( -0.81544152, -0.87912464 ), 
   vec2( -0.38277463, 0.27676836 ), 
   vec2( 0.97484401, 0.75648380 ), 
   vec2( 0.44323319, -0.97511562 ), 
   vec2( 0.53742979, -0.47373419 ), 
   vec2( -0.26496815, -0.41893133 ), 
   vec2( 0.79197508, 0.19090191 ), 
   vec2( -0.24188838, 0.99706499 ), 
   vec2( -0.81409960, 0.91437588 ), 
   vec2( 0.19984118, 0.78641372 ), 
   vec2( 0.14383159, -0.14100800 ) 
);

void main(){
	
	// Use Texture or Material Color
	vec3 MaterialDiffuseColor;
	if(hasTexture == 1)
	{
		MaterialDiffuseColor = texture( myTextureSampler, UV ).rgb;
	}
	else
	{
		MaterialDiffuseColor = diffuseColor;
	}
	vec3 AmbientIntensity = vec3(0.3,0.3,0.3);
	vec3 MaterialAmbientColor = AmbientIntensity * MaterialDiffuseColor;
	vec3 MaterialSpecularColor = specularColor;

	vec3 n = normalize( Normal_cameraspace );
	vec3 l = normalize( LightDirection_cameraspace );
	float cosTheta = clamp( dot( n,l ), 0,1 );
	
	vec3 E = normalize(EyeDirection_cameraspace);
	vec3 R = reflect(-l,n);
	float cosAlpha = clamp( dot( E,R ), 0,1 );
	

	float visibility=1.0;
	
	// Bias to get rid of Shadow acne
	float bias = 0.005;

	// PCF
	// 4 Times Stratified Poisson Sampling
	for (int i=0;i<4;i++){
		visibility -= 0.2*(1.0-texture( shadowMap, vec3(ShadowCoord.xy + disk[i]/700.0,  (ShadowCoord.z-bias)/ShadowCoord.w) ));
	}
	

	if(enableLighting == 0)
	{
		FragColor = vec4(MaterialAmbientColor + visibility * MaterialDiffuseColor * 0.1, enableTransparency==1 ? alpha : 1);
	}
	else
	{
		FragColor = vec4(MaterialAmbientColor +
			// Diffuse
			visibility * (MaterialDiffuseColor * cosTheta +
			// Specular
			MaterialSpecularColor * pow(cosAlpha,5)), enableTransparency==1 ? alpha : 1);
	}
	
	BrightColor = vec4(0,0,0,1);
	if(enableGlow == 1)
	{
		BrightColor = FragColor;
	}
}