function ChatIO(id) {
    this.namespace = id;
    this.FADE_TIME = 150;
    this.TYPING_TIMER_LENGTH = 400;
    this.COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];
    this.username = '';
    this.connected = false;
    this.typing = false;
    this.lastTypingTime = '';

    this.window = $(window);
    this.usernameInput = $('#' + this.namespace + ' .usernameInput'); // Input for username
    this.messages = $('#' + this.namespace + ' .messages'); // Messages area
    this.inputMessage = $('#' + this.namespace + ' .inputMessage'); // Input message input box
    this.loginPage = $('#' + this.namespace + ' .login.page'); // The login page
    this.chatPage = $('#' + this.namespace + ' .chat.page'); // The chatroom page

    this.addParticipantsMessage = function (data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "there's 1 participant";
        } else {
            message += "there are " + data.numUsers + " participants";
        }
        this.log(message);
    };
    // Sets the client's username
    this.setUsername = function (socket) {
        this.username = this.cleanInput(this.usernameInput.val().trim());
        // If the username is valid
        if (this.username) {
            this.loginPage.fadeOut();
            this.chatPage.show();
            this.loginPage.off('click');
            $currentInput = this.inputMessage.focus();
            // Tell the server your username
            socket.emit('add user', this.username);
        }
    };
    // Sends a chat message
    this.sendMessage = function (socket) {
        var message = this.inputMessage.val();
        // Prevent markup from being injected into the message
        message = this.cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && this.connected) {
            this.inputMessage.val('');
            this.addChatMessage({
                username: this.username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', message);
        }
    };
    // Log a message
    this.log = function (message, options) {
        var $el = $('<li>').addClass('log').text(message);
        this.addMessageElement($el, options);
    };
    // Adds the visual chat message to the message list
    this.addChatMessage = function (data, options) {
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = this.getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', this.getUsernameColor(data.username));
        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        this.addMessageElement($messageDiv, options);
    };

    // Adds the visual chat typing message
    this.addChatTyping = function (data) {
        data.typing = true;
        data.message = 'is typing';
        this.addChatMessage(data);
    };

    // Removes the visual chat typing message
    this.removeChatTyping = function (data) {
        this.getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    };

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    this.addMessageElement = function (el, options) {
        var $el = $(el);
        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(this.FADE_TIME);
        }
        if (options.prepend) {
            this.messages.prepend($el);
        } else {
            this.messages.append($el);
        }
        console.log(this.messages);
        this.messages[0].scrollTop = this.messages[0].scrollHeight;
    };
    // Prevents input from having injected markup
    this.cleanInput = function (input) {
        return $('<div/>').text(input).text();
    };

    // Updates the typing event
    this.updateTyping = function (socket) {
        if (this.connected) {
            if (!this.typing) {
                this.typing = true;
                socket.emit('typing');
            }
            this.lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - this.lastTypingTime;
                if (timeDiff >= this.TYPING_TIMER_LENGTH && this.typing) {
                    socket.emit('stop typing');
                    this.typing = false;
                }
            }, this.TYPING_TIMER_LENGTH);
        }
    };

    // Gets the 'X is typing' messages of a user
    this.getTypingMessages = function (data) {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    };

    // Gets the color of a username through our hash function
    this.getUsernameColor = function (username) {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < this.username.length; i++) {
            hash = this.username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % this.COLORS.length);
        return this.COLORS[index];
    };


    this.listen = function (id) {
        // Initialize variables
        var $window = $(window);
        var $currentInput = this.usernameInput.focus();
        var socket = io('/' + id);

        // Keyboard events
        var that = this;
        $window.keydown(function (event) {
            // Auto-focus the current input when a key is typed
            if (!(event.ctrlKey || event.metaKey || event.altKey)) {
                $currentInput.focus();
            }
            // When the client hits ENTER on their keyboard
            if (event.which === 13) {
                if (that.username) {
                    that.sendMessage(socket);
                    socket.emit('stop typing');
                    that.typing = false;
                } else {
                    that.setUsername(socket);
                }
            }
        });

        this.inputMessage.on('input', function () {
            that.updateTyping(socket);
        });

        // Click events

        // Focus input when clicking anywhere on login page
        this.loginPage.click(function () {
            $currentInput.focus();
        });

        // Focus input when clicking on the message input's border
        this.inputMessage.click(function () {
            this.inputMessage.focus();
        });

        // Socket events

        // Whenever the server emits 'login', log the login message
        socket.on('login', function (data) {
            that.connected = true;
            // Display the welcome message
            var message = "Welcome to Socket.IO Chat – ";
            that.log(message, {
                prepend: true
            });
            that.addParticipantsMessage(data);
        });

        // Whenever the server emits 'new message', update the chat body
        socket.on('new message', function (data) {
            that.addChatMessage(data);
        });

        // Whenever the server emits 'user joined', log it in the chat body
        socket.on('user joined', function (data) {
            that.log(data.username + ' joined');
            that.addParticipantsMessage(data);
        });

        // Whenever the server emits 'user left', log it in the chat body
        socket.on('user left', function (data) {
            that.log(data.username + ' left');
            that.addParticipantsMessage(data);
            that.removeChatTyping(data);
        });

        // Whenever the server emits 'typing', show the typing message
        socket.on('typing', function (data) {
            that.addChatTyping(data);
        });

        // Whenever the server emits 'stop typing', kill the typing message
        socket.on('stop typing', function (data) {
            that.removeChatTyping(data);
        });

    }
};

$(function () {
    // Chat.listen('my-namespace');
    var chat1 = new ChatIO('51283');
    chat1.listen('51283');
});