function display_people_data(people) {
    people.list.forEach(function(person) {
        if (!person.status in ['founding', 'later', 'postfreeze', 'former']) {
            return;
        }
        var minecraft = '';
        
        if (person.minecraft && person.minecraft.toLowerCase() !== person.interfaceName.toLowerCase()) {
            minecraft = '<p class="muted">' + person['minecraft'] + '</p>'
        };
        
        name = '<a href="/people/' + person.id + '">' + person.interfaceName + '</a>' + minecraft;
        
        var description;
        if (!person.description) {
            description = $('<td>', {'class': 'description small muted'}).html('Hier könnte Ihre Beschreibung stehen! (You can update your description using the command <code>people ' + person.id + ' description</code>.)');
        } else {
            description = $('<td>', {'class': 'description'}).html(person['description']);
        }
        $td = $('<td>', {'class': 'people-avatar'}).html(person.html_ava(32));
        $td.append($('<td>', {'class': 'username'}).html(name));
        $td.append(description);
        $('#loading-' + person.status + "-table").before($('<tr>', {'id': person.id}).html($td));
    });
    
    $('.loading').remove();
};

function load_people_data() {
    $.when(API.people())
        .done(function(people) {
            display_people_data(people);
        })
        .fail(function() {
            $('.loading').children('td').html('Error: could not load people.json');
        });
};

load_people_data();
