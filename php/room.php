<?php
        $password = $_GET["password"];
        $serverPassword = $_GET["serverPassword"];

        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST');
        header("Access-Control-Allow-Headers: X-Requested-With");

        if ($password != "<password>") {
                echo "Invalid Password";
        } else {

                $isHost = "false";
                $username = $_GET["username"];
                $accessPassword = $_GET["accessPassword"];
                $serverName = $_GET["serverName"];
                $room = $_GET["room"];

                $filename = "rooms/" . $room;
                $milliseconds = floor(microtime(true) * 1000);

                if (file_exists($filename)) {   
                        $key = file_get_contents($filename);
                        $keydata = json_decode($key);

                        if ($serverPassword === $keydata->serverPassword) {
                                $isHost = "true";

                                $keydata->username = $username;
                                $keydata->serverName = $serverName;
                                $keydata->accessPassword = $accessPassword;
                                $keydata->lastUpdate = $milliseconds;

                                $jsonString = json_encode($keydata, JSON_PRETTY_PRINT);
                                $fp = fopen($filename, 'w');
                                fwrite($fp, $jsonString);
                                fclose($fp);
                        } else {
                                if (isset($keydata->accessPassword)) {
                                        if ($keydata->accessPassword !== "") {
                                                if ($accessPassword !== $keydata->accessPassword) {
                                                        echo "Access Denied";
                                                        exit(0);
                                                }
                                        }
                                }
                        }
                } else {
                        if ($serverPassword !== null) {
                                $isHost = "true";
                                //
                                // create the file
                                $keydata = [
                                        "username" => $username,
                                        "serverPassword" => $serverPassword,
                                        "accessPassword" => $serverPassword,
                                        "serverName" => $serverPassword,
                                        "lastUpdate" => $milliseconds,
                                        "serverId" => $room
                                ];

                                $jsonString = json_encode($keydata, JSON_PRETTY_PRINT);
                                $fp = fopen($filename, 'w');
                                fwrite($fp, $jsonString);
                                fclose($fp);
                        }
                }

                $token = file_get_contents("https://node3.cokeandcode.com:8443/rooms?username=".urlencode($username)."&isHost=".$isHost."&room=".urlencode($room));
                echo $token."&".$isHost;

        }
