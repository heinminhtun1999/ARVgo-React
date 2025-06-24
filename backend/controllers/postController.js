module.exports.createPost = (req, res) => {

    console.log(req.body);

    res.status(200).json({
        message: "Post created successfully"
    })
};