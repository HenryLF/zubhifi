deploy :
	npm run build
	cd dist	&& vercel deploy --prod