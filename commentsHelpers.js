var commentsHelper = (function()
{
	var commentsApi = "http://sabas.land/POI-Backend-PHP/api.php";

	var loadComments = function (dataset, feature)
	{
		var key = encodeURIComponent(dataset + "_" + feature);
		var req = new XMLHttpRequest();
		req.onreadystatechange = function()
		{
			if (req.readyState != 4)
				return;
			if (req.status != 200)
				return;
			htmlHelper.displayComments(JSON.parse(req.responseText), dataset, feature);
		}
		req.open("POST", commentsApi, true);
		req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		req.send("action=get_comments&feature=" + key);
	};

	var addComment = function (dataset, feature)
	{
		var key = encodeURIComponent(dataset + "_" + feature);
		var comment = encodeURIComponent(document.getElementById("newCommentText").value);
		var req = new XMLHttpRequest();
		req.onreadystatechange = function()
		{
			if (req.readyState != 4)
				return;
			if (req.status != 200)
				return;
			document.getElementById("newCommentText").value = "";
			loadComments(dataset, feature); // reload comments to show own comment
		}
		req.open("POST", commentsApi, true);
		req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		req.send("action=comment&status=open&feature=" + key + "&comment=" + comment);
	};

	return {
		"loadComments": loadComments,
		"addComment": addComment,
		"clearComments": htmlHelper.clearComments,
	}
})();
