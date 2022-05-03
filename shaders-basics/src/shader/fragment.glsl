varying vec2 vUv;
varying float vNoise;

uniform sampler2D oceantexture;
uniform float time;



void main()	{
	// vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
	// vec3 color = vec3(.5 , 0. , 0.);
	// vec3 color2 = vec3(1. , 1. , 1.);
	// vec3 finalColor = mix(color , color2 , .5*(vNoise + 1.));

	vec2 newUV = vUv;
	

	// newUV = vec2(newUV.x , newUV.y + 0.01*sin(newUV.x*10.+time*.1));

	// vec4 oceanview = texture2D(oceantexture , newUV);


	// gl_FragColor = vec4(1.-vUv.x , 1.-vUv.y , 0. ,1.);
	// gl_FragColor = oceanview + vec4(vNoise);
	gl_FragColor =  vec4(vUv , 0. , 1.);
	// gl_FragColor =  vec4(vNoise);

}