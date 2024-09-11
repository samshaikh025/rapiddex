// select 2 field for coin
$(document).ready(function() {
    function formatOption(option) {
        if (!option.id) {
        return option.text;
        }
        var imgSrc = $(option.element).data('image');
        return $('<span><img src="' + imgSrc + '" class="option-image" /> ' + option.text + '</span>');
    }

    $("#mySelect2").select2({
        templateResult: formatOption, // Format the options
        templateSelection: formatOption, // Format the selected option
        minimumResultsForSearch: 1 // Enable search bar
    });
});

// change the division
$(document).ready(function() {
    // When "Select Coin" is clicked
    $('#select-coin').on('click', function() {
        $('#swap-wrapper').addClass('d-none');
        $('#swap-coin-wrapper').removeClass('d-none');
    });

    // When "Back to Swap" is clicked
    $('#back-to-swap').on('click', function() {
        $('#swap-coin-wrapper').addClass('d-none');
        $('#swap-wrapper').removeClass('d-none');
    });
    $('.coin-list-wrapper .inner-card').on('click', function() {
        $('#swap-coin-wrapper').addClass('d-none');
        $('#swap-wrapper').removeClass('d-none');
    });
});


