exports.getShippingPage = (req, res) => {
    res.render('shipping', {
        user: req.user,
        error: null
    });
};
