<?php
include('../config.php');
include(mnminclude.'comment.php');

header("Content-Type: text/plain");

$db->connect();
$sql = "select comment_id from comments where comment_date > date_sub(now(), interval 10 day) and comment_content like '%#%'";
$result = $db->dbh->query($sql);
while ($res = $result->fetch_object()) {
	$comment = new Comment;
	$comment->id = $res->comment_id;
	$comment->read();
	echo "Updating $comment->id\n";
	$comment->update_conversation();
	usleep(1000);
}
