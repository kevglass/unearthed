VALUE=`jq .version < version.json`
echo "{ \"version\" : \"$VALUE\" }" > version.json

echo Building Version: $VALUE

npm run build
scp dist/* kevglass@cokeandcode.com:cokeandcode.com/demos/unearthed
