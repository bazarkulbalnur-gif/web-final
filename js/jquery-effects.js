
$(function () {

    const $top = $('<button type="button" id="back-to-top" class="btn-wl" aria-label="Back to top"><i class="fa-solid fa-arrow-up"></i></button>')
        .hide().appendTo('body');
    $(window).on('scroll', function () {                                  
        if ($(this).scrollTop() > 300) { $top.fadeIn(200); } else { $top.fadeOut(200); }
    });
    $top.on('click', function () { $('html, body').animate({ scrollTop: 0 }, 500); });

    $('.stat-number').each(function () {
        const $el = $(this);
        const target = parseFloat($el.data('target'));
        const decimals = parseInt($el.data('decimals') || 0, 10);
        const suffix = $el.data('suffix') || '';
        $({ n: 0 }).animate({ n: target }, {
            duration: 1500,
            step: function (now) { $el.text(now.toFixed(decimals) + suffix); },
            complete: function () { $el.text(target.toFixed(decimals) + suffix); }
        });
    });

    $('#discover-grid').on('click', '.learn-toggle', function () {
        const $btn = $(this);
        const $details = $btn.closest('.destination-card').find('.destination-details');
        const opening = !$btn.hasClass('is-open');         
        $btn.toggleClass('is-open', opening);
        $details.slideToggle(250);
        $btn.find('.learn-label').text(opening ? 'Show less' : 'Learn more');
    });

    $('#faq-list').on('click', '.faq-question', function () {
        const $question = $(this);
        $question.next('.faq-answer').slideToggle(200);
        const $item = $question.closest('.faq-item').toggleClass('open');
        $question.attr('aria-expanded', $item.hasClass('open'));
        $item.siblings('.faq-item').removeClass('open').find('.faq-answer').slideUp(200);
    });

    $(document).on('mouseenter mouseleave', '.wl-card', function (event) {
        $(this).toggleClass('card-lift', event.type === 'mouseenter');
    });

    $('a[href^="http"]').attr({ target: '_blank', rel: 'noopener noreferrer' });

    $('#form-success').on('click', '.dismiss', function () { $(this).closest('#form-success').fadeOut(250); });
});
