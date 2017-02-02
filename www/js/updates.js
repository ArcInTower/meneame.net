;

function initFormPostEdit($form) {
    if (!$form.length) {
        return;
    }

    var $textarea = $form.find('textarea'),
        textareaSize = $textarea.outerHeight(),
        $textCounter = $form.find('.input-counter');

    $textarea.on('focus', function() {
        $form.find('.hidden.show-on-focus').hide().removeClass('hidden').slideDown();
    });

    $textarea.on('keyup', function() {
        $textCounter.val($textarea.attr('maxlength') - $textarea.val().length);
    });

    showPoll();

    $form.ajaxForm({
        async: false,
        success: function(response) {
            if (/^ERROR:/.test(response)) {
                return mDialog.notify(response, 5);
            }

            var id = parseInt($form.find('input[name="post_id"]').val()),
                $container;

            if (id > 0) {
                $container = $('#pcontainer-' + id);
            } else {
                $('.comments-list:first').prepend($container = $('<li />'));
            }

            $textarea.animate({ height: textareaSize });

            $container.html(response).trigger('DOMChanged', $container);

            $form.find('.show-on-focus').slideUp().addClass('hidden');
            $form.find('textarea, input[type="text"], input[name="post_id"]').val('');
            $form.find('input[name="key"]').val(Math.floor(Math.random() * (100000000 - 1000000)) + 1000000);

            initPollVote($container.find('.poll-vote form').first());
        }
    });

    $form.droparea({
        maxsize: $form.find('input[name="MAX_FILE_SIZE"]').val()
    });

    $form.find('.uploadFile').nicefileinput();

    $textarea.autosize();
}

function initPollVote($form) {
    if (!$form || !$form.length) {
        return;
    }

    $form.ajaxForm({
        async: false,
        success: function(response) {
            if (/^ERROR:/.test(response)) {
                return mDialog.notify(response, 5);
            }

            $form.closest('.poll-vote').replaceWith(response);
        }
    });
}

function showPoll() {
    $('[data-show-poll="true"]').off('click').on('click', function(e) {
        e.preventDefault();

        var $element = $(this).closest('form').find('.poll-edit');

        if ($element.is(':visible')) {
            $element.slideUp();
        } else {
            $element.hide().removeClass('hidden').slideDown();
        }
    });
}

;(function($) {
    var INIT = {};

    INIT.formRegister = function() {
        var $form = $('#form-register');

        if (!$form.length) {
            return;
        }

        var $password = $form.find('#password'),
            $name = $form.find('#name'),
            $email = $form.find('#email');

        function setStatus($input, response, hideError) {
            var $parent = $input.parent(),
                $status = $parent.find('.input-status');

            $parent.removeClass('input-error input-success');
            $status.removeClass('fa-check fa-times');

            $parent.find('.input-error-message').remove();

            if (response === 'OK') {
                $parent.addClass('input-success');
                $status.addClass('fa-check');

                return;
            }

            if (hideError !== true) {
                $parent.addClass('input-error');
                $status.addClass('fa-times');
            }

            if (response !== 'KO') {
                $parent.append('<span class="input-error-message">' + response + '</span>');
            }
        }

        function checkAjaxField($input, callback) {
            var value = $input.val();

            if ($input.data('previous') === value) {
                return;
            }

            if (typeof callback !== 'function') {
                callback = setStatus;
            }

            $.get(base_url + 'backend/checkfield', {type: $input.attr('name'), name: value}, function(response) {
                callback($input, response);
            });

            $input.data('previous', value);
        }

        function securePasswordCheck(value) {
            return (value.length >= 8) && value.match('^(?=.{8,})(?=(.*[a-z].*))(?=(.*[A-Z].*))(?=(.*[0-9].*)).*$', 'g');
        }

        $name.on('change', function() {
            checkAjaxField($name);
        });

        $email.on('change', function() {
            checkAjaxField($email);
        });

        $password.on('keyup', function() {
            setStatus($password, securePasswordCheck($password.val()) ? 'OK' : 'KO', true);
        });

        $password.on('change', function() {
            setStatus($password, securePasswordCheck($password.val()) ? 'OK' : 'KO');
        });

        $('.input-password-show').on('click', function(e) {
            e.preventDefault();

            var $icon = $(this).find('.fa');

            if ($password.attr('type') === 'text') {
                $password.attr('type', 'password');
                $icon.removeClass('fa-eye-slash').addClass('fa-eye');
            } else {
                $password.attr('type', 'text');
                $icon.removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });

        $form.on('submit', function(e) {
            $name.trigger('change');
            $email.trigger('change');
            $password.trigger('change');

            if ($form.find('.input-validate').length !== $form.find('.input-validate.input-success').length) {
                e.preventDefault();
                return;
            }

            $form.append('<input type="hidden" name="base_key" value="' + base_key + '" />');
        });

        if ($name.val()) {
            $name.trigger('change');
        }

        if ($email.val()) {
            $email.trigger('change');
        }
    };

    INIT.showSubDescription = function() {
        $('.show-sub-description').on('click', function(e) {
            e.preventDefault();

            var $description = $('.sub-description');

            if ($description.hasClass('hidden')) {
                $description.hide().removeClass('hidden');
            }

            $description.slideToggle();
        });
    };

    INIT.formSubsSearch = function() {
        var $form = $('#form-subs-search');

        if (!$form.length) {
            return;
        }

        var $inputSearch = $form.find('.input-search');

        $.ajax({
            url: base_url + 'backend/get_subs.php',
            cache: false,
            dataType: 'json',
            success: function(data) {
                $inputSearch.typeahead({
                    source: data,
                    fitToElement: true,
                    displayText: function(item) {
                        return '<div class="name">' + item.name + '</div><div class="description">' + item.name_long + '</div>';
                    },
                    highlighter: function(item) {
                        return item;
                    },
                    afterSelect: function(item) {
                        $inputSearch.val(item.name);

                        window.location = base_url + 'm/' + item.name;
                    }
                });
            }
        });

        $form.find('.input-filter').on('change', function(e) {
            window.location = base_url + 'subs?' + $(this).val();
        });
    };

    INIT.formPostEdit = function() {
        $('.post-edit form').each(function() {
            var $form = $(this);

            addPostCode(function() {
                initFormPostEdit($form);
            });
        });
    };

    INIT.commentExpand = function() {
        function hide($button, $parent, $childs, id) {
            $childs.hide();
            $parent.addClass('comment-collapsed');
            $button.text('[+]');
        }

        function show($button, $parent, $childs, id) {
            $childs.show();
            $parent.removeClass('comment-collapsed');
            $button.text('[–]');
        }

        $('.comment-header .comment-expand').on('click', function(e) {
            e.preventDefault();

            var $this = $(this),
                $parent = $this.closest('.threader'),
                $childs = $parent.find('> .threader'),
                id = $this.data('id');

            if ($parent.hasClass('comment-collapsed')) {
                show($this, $parent, $childs, id);
            } else {
                hide($this, $parent, $childs, id);
            }
        });
    };

    INIT.formPollVote = function() {
        $('.poll-vote form').each(function() {
            var $form = $(this);

            addPostCode(function() {
                initPollVote($form);
            });
        });
    };

    INIT.showPoll = function() {
        showPoll();
    };

    INIT.formRegister();
    INIT.showSubDescription();
    INIT.formSubsSearch();
    INIT.formPostEdit();
    INIT.showPoll();
    INIT.formPollVote();
    INIT.commentExpand();
})(jQuery);
