function bind_tab_events() {
    $('.tab-item').bind('click', function(eventObject) {
        eventObject.preventDefault();
        $(this).tab('show');
    });

    $('.tab-item').on('show.bs.tab', function(e) {
        var id = $(this).attr('id')
        var elementid = id.substring('tab-'.length, id.length);
        var selected = $('#' + elementid);
        $('.stats-section').each(function(index, element) {
            var table = $(element);
            if (table.attr('id') == selected.attr('id')) {
                table.removeClass("hidden");
            } else {
                table.addClass("hidden");
            }
        });
    });

    if (location.hash !== '') $('a[href="' + location.hash + '"]').tab('show');
        return $('a.tab-item').on('shown.bs.tab', function(e) {
            return location.hash = $(e.target).attr('href').substr(1);
    });
}

function select_tab_with_id(id) {
    $('#' + id).tab('show');
}

function url_domain(data) {
    var a = document.createElement('a');
    a.href = data;
    return a.hostname;
}

function reddit_user_link(username) {
    return 'https://reddit.com/u/' + username;
}

function twitter_user_link(username) {
    return 'https://twitter.com/' + username;
}

function wiki_user_link(username) {
    username = username.replace(/ /g, '_');
    return 'http://wiki.wurstmineberg.de/User:' + username;
}

function initialize_tooltips() {
    $(function () {
        $("[rel='tooltip']").tooltip();
    });
}

// Some string functions to ease the parsing of substrings
String.prototype.startsWith = function(needle)
{
    return(this.indexOf(needle) == 0);
};

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function linkify_headers() {
    // Do the stuff to the headers to linkify them

    $.each($('h2'), function() {
        $(this).addClass("anchor");
        $(this).append('&nbsp;<a class="tag" href="#' + $(this).attr('id') + '">¶</a>');
    });
    $('h2').hover(function() {
        $(this).children('.tag').css('display', 'inline');
    }, function() {
        $(this).children('.tag').css('display', 'none');
    });
}

function configure_navigation() {
    var navigation_items = $("#navbar-list > li");
    var windowpath = window.location.pathname;

    // Iterate over the list items and change the container of the active nav item to active
    $.each(navigation_items, function() {
        var elementlink = $(this).children($("a"))[0];
        var elementpath = elementlink.getAttribute("href");
        if (elementpath === windowpath) {
            $(this).addClass("active");
        }
    });
}

function set_anchor_height() {
    var navigation_height = $(".navbar").css("height");
    var anchor = $(".anchor");

    anchor.css("padding-top", "+=" + navigation_height);
    anchor.css("margin-top", "-=" + navigation_height);
}

function minecraft_ticks_to_real_minutes(minecraft_minutes) {
    return minecraft_minutes / 1200;
}

function prettify_stats_value(key, value) {
    var final_value = value;

    if (key.endsWith('OneCm')) {
        if (value > 100000) {
            final_value = (value / 100000).toFixed(2) + 'km';
        } else if (value > 100) {
            final_value = (value / 100).toFixed(2) + 'm';
        } else {
            final_value = value + 'cm';
        }
    } else if (key.endsWith('OneMinute')) {
        var minutes = Math.floor(minecraft_ticks_to_real_minutes(value));
        var hours = 0;
        var days = 0;

        if (minutes >= 60) {
            hours = Math.floor(minutes / 60);
            minutes = minutes % 60;
        }

        if (hours >= 24) {
            days = Math.floor(hours / 60);
            hours = hours % 24;
        }

        final_value = '';
        if (days) {
            final_value += days + 'd ';
        }
        if (hours) {
            final_value += hours + 'h ';
        }
        if (minutes) {
            final_value += minutes + 'min '
        }
    } else if (key.startsWith('damage')) {
        final_value = (value / 2) + ' hearts';
    }

    return final_value;
}

function minecraft_nick_to_username(minecraft, people) {
    var playername;
    $.each(people, function(index, values) {
        if (['minecraft'] in values) {
            if (minecraft === values['minecraft']) {
                if ('name' in values) {
                    playername = values['name'];
                } else {
                    playername = values['id'];
                }
                return;
            };
        };
    });

    return playername;
}

function username_for_player_values(values) {
    if ('name' in values) {
        return values['name'];
    }

    return values['id'];
}

function username_to_minecraft_nick(username, people) {
    var minecraftname;

    $.each(people, function(index, values) {
        var name = username_for_player_values(values)
        if (name === username) {
            if ('minecraft' in values) {
                minecraftname = values['minecraft'];
            }
        }
    });

    return minecraftname;
}

function fetch_string_data() {
    return $.ajax('/static/json/strings.json', {
        dataType: 'json'
    });
}

function fetch_item_data() {
    return $.ajax('/static/json/items.json', {
        dataType: 'json'
    });
}

function fetch_player_data() {
    return $.ajax('/assets/serverstatus/people.json', {
        dataType: 'json'
    });
}

function html_player_list(names, player_data) {
    var html = '';

    $.each(names, function(index, name) {
        if (index >= 1) {
            html += ', ';
        };

        var ava = '/assets/img/ava/' + username_to_minecraft_nick(name, player_data) + '.png';
        html += '<img src="' + ava + '" class="avatar" /><a class="player" href="/people/' + name + '">' + name + '</a>';
    });

    return html;
}

function getServerStatus(on,version) {
    if (on) {
        var versionString = version == null ? "(error)" : ('<a href="http://minecraft.gamepedia.com/Version_history' + ((version.indexOf('pre') != 1 || version.substring(2,3) == 'w') ? '/Development_versions#' : '#') + version + '" style="font-weight: bold;">' + version + '</a>');
        document.getElementById('serverinfo').innerHTML = 'The server is currently <strong>online</strong> and running on version ' + versionString + ', and <span id="peopleCount">(loading) of the (loading) whitelisted players are</span> currently active.<br /><span id="peopleList"></span>';
    } else {
        document.getElementById('serverinfo').innerHTML = "The server is <strong>offline</strong> right now. For more information, consult the <a href='http://twitter.com/wurstmineberg'>Twitter account</a>.";
    }
}

function getOnlineData(list) {
    $.when(fetch_player_data()).done(function(player_data) {
        if (list.length == 1) {
            document.getElementById('peopleCount').innerHTML = 'one of the <span id="whitelistCount">(loading)</span> whitelisted players is';
        } else if (list.length == 0) {
            document.getElementById('peopleCount').innerHTML = 'none of the <span id="whitelistCount">(loading)</span> whitelisted players are';
        } else {
            document.getElementById('peopleCount').innerHTML = list.length + ' of the <span id="whitelistCount">(loading)</span> whitelisted players are';
        }
        $.ajax('assets/serverstatus/people.json', {
            dataType: 'json',
            error: function(request, status, error) {
                document.getElementById('whitelistCount').innerHTML = '(error)';
            },
            success: function(data) {
                document.getElementById('whitelistCount').innerHTML = data.filter(function(person) {
                    return (('status' in person ? person['status'] : 'later') != 'former');
                }).length;
            }
        });

        list = list.map(function(name) {
            return minecraft_nick_to_username(name, player_data);
        });
        document.getElementById('peopleList').innerHTML = html_player_list(list, player_data);
    });
}

function display_funding_data() {
    $.ajax('/assets/serverstatus/moneys.json', {
        dataType: 'json',
        error: function(request, status, error) {
            $('.funding-month').html('(error)');
            $('.funding-progressbar').removeClass('active');
            $('.funding-progressbar').children('.progress-bar').addClass('progress-bar-danger');
        },
        success: function(data) {
            $('.funding-progressbar').removeClass('active progress-striped');
            $('.funding-progressbar').empty();
            var funding_total = 0.0;

            data['history'].forEach(function(transaction) {
                if (transaction['type'] !== 'nessus-monthly') {
                    funding_total += transaction['amount'];
                };
            });



            var today = new Date();

            // This is the beginning of the billing period: Sept-Oct 2013
            var begin_month = 8;
            var begin_year = 2013;

            // This is the current month that is currently funded
            var funded_year = begin_year;
            var funded_month = begin_month;

            // This is today
            var year = today.getFullYear();
            var month = today.getMonth();
            var day = today.getDay();

            var spending_monthly = Math.abs(data['spending_monthly']);

            // Subtract the first month
            funding_total -= spending_monthly;

            // Add a month until it doesn't fit anymore
            while (funding_total >= spending_monthly) {
                funded_month++;
                if (funded_month >= 12) {
                    funded_year++;
                    funded_month = 0;
                }

                funding_total -= spending_monthly;
            }

            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var abbr_months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            if (funded_month == 11) {
                $('.funding-month').html(months[funded_month] + ' ' + funded_year + ' to ' + months[0] + ' ' + (funded_year + 1));
                $('.funding-month-small').html(abbr_months[funded_month] + ' ' + funded_year % 100 + ' to ' + abbr_months[0] + ' ' + (funded_year + 1) % 100);
            } else {
                $('.funding-month').html(months[funded_month] + ' to ' + months[(funded_month + 1) % 12] + ' ' + funded_year);
                $('.funding-month-small').html(abbr_months[funded_month] + ' to ' + abbr_months[(funded_month + 1) % 12] + ' ' + funded_year % 100);
            }

            var percent = 0;

            var funded_for_this_month = false;
            if (funded_year > year) {
                // We are funded until next year
                funded_for_this_month = true;
            } else {
                if (funded_month == month) {
                    // We are in the month that is just not funded.
                    // Check if the billing date is already over.

                    if (day < data['billing_dom']) {
                        funded_for_this_month = true;
                    }
                } else {
                    funded_for_this_month = funded_month >= month;
                }
            }

            if (funded_for_this_month) {
                percent = Math.floor(funding_total * 100 / spending_monthly);
                $('.funding-progressbar').append('<div class="progress-bar progress-bar-success" style="width: ' + percent + '%;"><span class="sr-only">' + percent + '% funded</span></div>');
            } else {
                var expected_total = funding_total;

                data['history'].forEach(function(transaction) {
                    if (transaction['type'] == 'player-monthly') {
                        var transaction_year = transaction['date'].split('-')[0];
                        var transaction_month = transaction['date'].split('-')[1];
                        var transaction_day = transaction['date'].split('-')[2];
                        if (transaction_day < data['billing_dom']) {
                            if ((transaction_month - 1 == month && transaction_year == year) || (month == 12 && transaction_month == 1 && transaction_year - 1 == year)) {
                                expected_total -= transaction['amount'];
                            }
                        } else if (transaction_year == year && transaction_month == month) {
                            expected_total -= transaction['amount'];
                        }
                    }
                });

                var expected_percent = Math.max(0, Math.min(100 - percent, Math.floor(expected_total * 100 / -data['spending_monthly'])));
                var progress_bar_class = "progress-bar-warning";
                if (expected_percent <= 50) {
                    progress_bar_class = "progress-bar-danger";
                }

                $('.funding-progressbar').append('<div class="progress-bar progress-bar-success" style="width: ' + expected_percent + '%;"><span class="sr-only">' + expected_percent + '% expected</span></div>');
                $('.funding-progressbar').append('<div class="progress-bar ' + progress_bar_class + '" style="width: ' + (100 - expected_percent) + '%;"><span class="sr-only">bla</span></div>');
            }
        }
    });
}

// Run by default
linkify_headers();
configure_navigation();
set_anchor_height();
display_funding_data();
