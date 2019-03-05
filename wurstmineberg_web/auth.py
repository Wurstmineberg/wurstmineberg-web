import flask
import flask_dance.contrib.discord
import flask_login
import jinja2
import urllib.parse

from wurstmineberg_web import app
from wurstmineberg_web.models import Person

if 'clientID' not in app.config.get('wurstminebot', {}) or 'clientSecret' not in app.config.get('wurstminebot', {}):
    return #TODO mount error messages at /login and /auth
app.config['SECRET_KEY'] = app.config['wurstminebot']['clientSecret']
app.config['USE_SESSION_FOR_NEXT'] = True

app.register_blueprint(flask_dance.contrib.discord.make_discord_blueprint(
    client_id=app.config['wurstminebot']['clientID'],
    client_secret=app.config['wurstminebot']['clientSecret'],
    scope='identify',
    redirect_to='auth_callback'
), url_prefix='/login')

login_manager = flask_login.LoginManager()
login_manager.login_view = 'discord.login'
login_manager.login_message = None # Because discord.login does not show flashes, any login message would be shown after a successful login. This would be confusing.

@login_manager.user_loader
def load_user(user_id):
    try:
        return Person(snowflake=user_id)
    except (TypeError, ValueError):
        return None

login_manager.init_app(app)

@app.before_request
def global_user():
    if flask_login.current_user.is_admin and 'viewAs' in app.config['web']:
        flask.g.view_as = True
        flask.g.user = Person(snowflake=app.config['web']['viewAs'])
    else:
        flask.g.view_as = False
        flask.g.user = flask_login.current_user

@app.context_processor
def inject_user():
    try:
        return {'user': flask.g.user}
    except AttributeError:
        return {'user': None}

def is_safe_url(target):
    ref_url = urllib.parse.urlparse(flask.request.host_url)
    test_url = urllib.parse.urlparse(urllib.parse.urljoin(flask.request.host_url, target))
    return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc

@app.route('/auth')
def auth_callback():
    if not flask_dance.contrib.discord.discord.authorized:
        flask.flash('Login failed.', 'error')
        return flask.redirect(flask.url_for('index'))
    response = flask_dance.contrib.discord.discord.get('/api/v6/users/@me')
    if not response.ok:
        return flask.make_response(('Discord returned error {} at {}: {}'.format(response.status_code, jinja2.escape(response.url), jinja2.escape(response.text)), response.status_code, []))
    person = Person(snowflake=response.json()['id'])
    if not person.is_active:
        try:
            person.profile_data
        except FileNotFoundError:
            flask.flash('You have successfully authenticated your Discord account, but you\'re not in the Wurstmineberg Discord server.', 'error')
            return flask.redirect(flask.url_for('index'))
        else:
            flask.flash('Your account has not yet been whitelisted. Please schedule a server tour in #general.', 'error')
            return flask.redirect(flask.url_for('index'))
    flask_login.login_user(person, remember=True)
    flask.flash(jinja2.Markup('Hello {}.'.format(person.__html__())))
    next_url = flask.session.get('next')
    if next_url is None:
        return flask.redirect(flask.url_for('index'))
    elif is_safe_url(next_url):
        return flask.redirect(next_url)
    else:
        return flask.abort(400)

@app.route('/logout')
def logout():
    flask_login.logout_user()
    return flask.redirect(flask.url_for('index'))
