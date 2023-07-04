cd ..
for i in */; do cd ${i%/}; zip -r "../zips/${i%/}.zip" *; cd ..; done
cd zips
rm -rf zips.zip
