# package up the mods 
cd mods/zips
./package.sh
cd -

VALUE=`jq .version < version.json`
VALUE=`echo $VALUE + 1 | bc`
echo "{ \"version\" : $VALUE }" > version.json

echo Building Version: $VALUE

npm run build
cd dist
rm -f ../dist.zip
zip -r ../dist.zip . >/dev/null
cd ..

scp dist.zip kevglass@cokeandcode.com:cokeandcode.com/demos/unearthed
scp version.json kevglass@cokeandcode.com:cokeandcode.com/demos/unearthed
ssh kevglass@cokeandcode.com "cd cokeandcode.com/demos/unearthed; pwd; unzip -o dist.zip; rm -f dist.zip" >/dev/null 2>/dev/null
rm dist.zip
