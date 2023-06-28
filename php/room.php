<?php
	$password = $_GET["password"];
	$serverPassword = $_GET["serverPassword"];
	
 	if ($password != "serverPassword") {
		http_response_code(403);
        } else {
		header('Access-Control-Allow-Origin: *');
		header('Access-Control-Allow-Methods: GET, POST');
		header("Access-Control-Allow-Headers: X-Requested-With");

		$isHost = "false";
		$username = $_GET["username"];
		$room = $_GET["room"];

		$filename = "rooms/" . $room;
        if (file_exists($filename)) {
            $key = file_get_contents($filename);
            $keydata = json_decode($key);
            if ($serverPassword === $keydata->serverPassword) {
                    $isHost = "true";

                    $keydata->username = $username;
                    $jsonString = json_encode($keydata, JSON_PRETTY_PRINT);
                    $fp = fopen($filename, 'w');
                    fwrite($fp, $jsonString);
                    fclose($fp);
            }
        } else {
            if ($serverPassword !== null) {
                    // create the file
                    $keydata = [
                            "username" => $username,
                            "serverPassword" => $serverPassword,
                            "serverId" => $room
                    ];

                    $jsonString = json_encode($keydata, JSON_PRETTY_PRINT);
                    $fp = fopen($filename, 'w');
                    fwrite($fp, $jsonString);
                    fclose($fp);
            }
        }

		readfile("https://serverhost/rooms?username=".urlencode($username)."&isHost=
".$isHost."&room=".urlencode($room));
	}