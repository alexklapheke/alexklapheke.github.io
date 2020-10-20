---
date: 1603225390
title: Useful shell scripts
---

::: {.epigraph}
You should have brought many things, he thought. But you did not bring
them, old man. Now is no time to think of what you do not have. Think of
what you can do with what there is.
:::

With increasingly sophisticated tools available, it may seem silly to
mess around with shell scripts, which are nearly half a century old and
have a clunky, unintuitive syntax. Nevertheless, shell scripts are fast,
ubiquitous on UNIX-based systems, and, if they live in your `~/.bashrc`
(or equivalent) file, always at hand. Much of their power lies in the
pipe operator (`|`{.bash}), which is basically function composition in
reverse, allowing commands to be strung together without storing
intermediate results. In addition, you can add custom tab completion to
any function in one line with the `complete`{.bash} command. This can
make them an excellent replacement for high-level tools that, while
powerful, are often built on an Indra's net of dependencies. Below are
some of the everyday tasks I've used the shell to make simpler.

# Data science

A lot of data processing can be done using standard commands such as
`cut`, `paste`, `column`, `comm`, and `combine`. For example, the
following displays the first ten lines of a CSV file of any size, even a
multi-gigabyte file too large to load into pandas.

``` {.bash}
head -10 file.csv | column -ts, | less -S
```

Here, `column -ts,`{.bash} formats the file into columns with a comma
delimiter, and `less -S`{.bash} overflows long lines rather than
wrapping them. It's simple enough to package this into a function that
can live in your `~/.bashrc`:

``` {.bash}
# Show the first few lines of a (potentially large) CSV file
csv_head () {
    local file=${1:?Usage: csv_head file [rows]}
    head -${2:-10} "$file" | column -ts, | less -S
}
```

Using `sed` and `cut`, we can also write a function that navigates
through CSV files, à la pandas' `.loc[]`{.python} function, taking
either single numbers or ranges (`1-2`) as arguments:

``` {.bash}
# Navigate through cells in a CSV file
csv_loc () {
    local file=${1:?Usage: csv_loc file.csv [rows] [cols]}
    sed -n "${2/-/,}p" "$file" | cut -d, -f "${3:-1-}"
}
```

You can do more interesting file processing tasks as well. For a CSV
file that's truly massive, the `split`{.bash} utility can parse it out
into equally sized chunks, and a simple wrapper script can do this while
preserving the header in each file:

``` {.bash}
split_csv () {
    local file=${1:?Usage: split_csv file}
    local base="${file%.*}"
    local ext="${file##*.}"

    # Write out header
    local header=$(head -1 "$file")

    # Split into 100MB chunks, minus header
    tail +2 "$file" | split -d -C 100MB - "$base-" \
        --additional-suffix=".$ext"

    # Write header onto each chunk
    for chunk in "$base"-*."$ext"; do
        cat <(echo "$header") "$chunk" | sponge "$chunk"
    done
}
```

Now you can process the file one piece at a time.

# Jupyter

Of course, data analyses of any sophistication require more advanced
tools. [Jupyter](https://jupyter.org/) notebooks are a great mini-IDE
for creating
[literate](https://en.wikipedia.org/wiki/Literate_programming) Python
programs, but hard to work with in the terminal; one glaring omission is
a way to create a new notebook from the command line. This script, which
lives in my `~/.bashrc`, lets me type `jn <filename>`{.bash} (with or
without file extension) at the command line, opening the file if it
exists and creating it if not.[^1]

``` {.bash}
jn () {
    # Complete filename with .ipynb extension if not present
    local filename=${1%.ipynb}.ipynb

    # Create notebook if it doesn't already exist
    if [[ ! -f "$filename" ]]; then
        echo '{"cells": [], "metadata": {}, "nbformat": 4, "nbformat_minor": 4}' > "$filename"
    fi

    # Open notebook
    jupyter-notebook "$filename"
}
```

Sometimes, though, I don't want to start a whole Jupyter server just to
examine the source code in a notebook. You can export the notebooks as
pure code with `jupyter-nbconvert --to python`{.bash}, but this is slow
and include a lot of cruft like cell numbers. Fortunately, the notebooks
themselves are just JSON files, and are easy to parse with a tool like
[jq](https://stedolan.github.io/jq/). The following function extracts
the code from a notebook:

``` {.bash}
# Extract code cells from a Jupyter notebook
jn_src () {
    jq -j '.cells[] | select(.cell_type == "code").source[], "\n\n"' "$1"
}
```

This makes it easy to treat the notebooks just like `.py` files:

``` {.bash}
# Run code from Jupyter notebook
jn_src notebook.ipynb | python3

# Edit in Vim
jn_src notebook.ipynb | vim -c "setf python" -

# Show differences between two notebooks
diff <(jn_src notebook1.ipynb) <(jn_src notebook2.ipynb)
```

Finally, you can add tab completion to both these functions to quickly
navigate to your notebook files.

``` {.bash}
# Tab complete files with .ipynb extension
complete -o plusdirs -f -X '!*.ipynb' jn
complete -o plusdirs -f -X '!*.ipynb' jn_src
```

# tmux

Another nuisance of Jupyter is that it keeps open the terminal it was
launched from for writing log output, which is rarely useful. The
solution is to use [tmux](https://tmux.github.io/), a "terminal
multiplexer" that allows you to manage terminals by naming them,
splitting them onscreen into windows, and moving them into the
background ("detaching") and foreground ("attaching"). I have a shortcut
that executes `tmux new-session -A -s Jupyter`{.bash}---this opens a
"Jupyter" session, creating it if it doesn't exist. From there, I create
a new window in the session with <kbd>C-b c</kbd>, give it a name with
<kbd>C-b ,</kbd>, and launch the notebook server with `jn`{.bash}. I can
then detach it with <kbd>C-b d</kbd> so that it's running in the
background. If I want to close down the server, I can get back to it
from any terminal with <kbd>C-b w</kbd>.

For times when I just want to jump into a detached session to close it,
I have the following helper function:

``` {.bash}
# Attach a detached tmux session from tmux
t () {
    local curr="$(tmux display-message -p "#S")"
    tmux switch -t "$1"
    tmux kill-session -t "$curr"
}

# Tab complete with detached tmux sessions
complete -W "$(tmux list-sessions -F "#{?session_attached,,#S}")" t
```

This ability to detach windows is also invaluable when using ssh. For
instance, when logging onto an [EC2](https://aws.amazon.com/ec2/)
instance, I can attach a tmux instance on the server, name it, then
detach and close the connection, coming back to it later when I think
it's almost finished. That way, I am never logged out of the server, and
even if my connection breaks, the command won't. To automate this, I put
the following block in my `~/.ssh/config`:

``` {.sshconf}
Host *.amazonaws.com
User ubuntu
IdentityFile ~/.ssh/aws-ssh.pem
RequestTTY force
RemoteCommand tmux new -A -s aws
LocalForward 9999 localhost:8888
```

Now, when I `ssh ec2-whatever.compute.amazonaws.com`{.bash}, it will
automatically log in and attach to the tmux instance called `aws`,
creating it if there is none (the `RequestTTY`{.sshconf} line is there
to make sure that tmux starts in a shell). After running a command, I
hit <kbd>C-b C-b d</kbd> to detach the remote session,[^2] and I am
disconnected from the server, but the command is still running on the
server.

(The `LocalForward`{.sshconf} line, incidentally, sets up port
forwarding for Jupyter notebooks---using one, though, means I can't
detach the remote session, as that would sever the connection between
local notebook interface and remote kernel.)

# Man page replacements

Lots of small utilities like [cheat](https://github.com/cheat/cheat) and
[tldr](https://tldr.sh/) offer "example pages", supplementing man pages
by storing oft-used formulas. The pages themselves are extremely useful,
making this one of my most-used commands,[^3] but the utilities
themselves tend to be on the bloated side. It's simple enough to
implement this in a few lines of BASH.

``` {.bash}
export cheatdir="$HOME/.cheat/"

# Easy user-defined man pages
cheat () {
    case "$1" in "-e") shift; $EDITOR "${cheatdir%/}/$1" ;; esac
    cat "${cheatdir%/}/${1:?Usage: cheat [-e] command_name}"
}

# Tab complete entries in $cheatdir
complete -W "$(ls ${cheatdir})" cheat
```

Just run `cheat <command>` to view its page, and `cheat -e <command>` to
edit it.

This template can be expanded on; for instance, if you want syntax
highlighting, you can install
[source-highlight](http://www.gnu.org/software/src-highlite/), and
replace `cat`{.bash} with
`source-highlight --src-lang shell --out-format esc --input`{.bash}.

# Passwords

I like to use [XKCD-style](https://xkcd.com/936/) passwords. They are
memorable and secure because they draw from a massive entropy pool we
already carry around in our heads: the lexicon. A typical English
speaker knows on the order of $10^4$ words [see, e.g., @nagy1984how],
and a typical [diceware
wordlist](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt)
contains $6^5 = 7,776$ of those. Choosing six words from the list,
without replacement, provides
$\log_2\left(\frac{ {6^5}!}{ {(6^5-6)}!}\right) \approx 77$ bits of
entropy.[^4]

``` {.bash}
# Generate a memorable passphrase of n words (default: 6)
diceware () {
    shuf --random-source=/dev/random -n ${1:-6} eff_diceware.txt | cut -f 2 | paste -s -d ' '
}
```

The `--random-source` flag is important here: it provides true hardware
randomness, like you'd get rolling physical dice. By default, the
command uses a pseudorandom number generator, which is deterministic;
these can be
[guessed](https://www.wired.com/story/meet-alex-the-russian-casino-hacker-who-makes-millions-targeting-slot-machines/)
and even
[gamed](https://www.schneier.com/blog/archives/2007/11/the_strange_sto.html),
hurting security by making some permutations of words more likely than
others.

Of course, if
[fatuous](https://www.wsj.com/articles/the-man-who-wrote-those-password-rules-has-a-new-tip-n3v-r-m1-d-1502124118)
[rules](https://www.microsoft.com/en-us/research/publication/where-do-security-policies-come-from/)
like including punctuation are enforced, you can easily generate
"old-fashioned" passwords:

``` {.bash}
# Generate a random password of n characters (default: 16)
bad_password () {
    strings /dev/urandom | tr -d '[:space:]' | head -c ${1:-16}; echo
}
```

# Music

It's not really known for it, but Reddit is home to a huge network of
[music subreddits](https://old.reddit.com/r/Music/wiki/musicsubreddits),
each representing a genre or subgenre, to which users post YouTube or
SoundCloud links. There are services that aggregate these into an
internet radio station, but it is simple enough to parse the JSON
yourself and pipe it to VLC (make sure it's running an updated version
of
[`youtube.lua`](https://github.com/videolan/vlc/blob/master/share/lua/playlist/youtube.lua)),
or your media player of choice.

``` {.bash}
# Play youtube links from music subreddits
reddit_music () {
    curl "https://www.reddit.com/r/${1:-listentothis}/.json?limit=100" | \
        jq -r '.data.children[].data.url' | \
        vlc --novideo --preferred-resolution=360 --network-caching=30000 - &
}
```

The `--novideo` and `--preferred-resolution=360` flags save bandwidth by
getting only the audio stream, and `--network-caching=30000` makes sure
the songs buffer long enough that there's no lag.

We can even add "stations" manually to the tab completion command as a
way of bookmarking them:

``` {.bash}
# Add your favorite genres here
complete -W "
    listentothis
    SoundsVintage
    90sAlternative
    MFPMPPJWFA
" reddit_music
```

If you want to combine subreddits, you can just concatenate them with a
plus sign (`swinghouse+triphop`); VLC will play the top songs from both.

[^1]: The `nbformat` and `nbformat_minor` keys are for my version of
    Jupyter. For other versions, you can get the appropriate numbers
    with:

    ``` {.python}
    import nbformat
    print(
        nbformat.current_nbformat,
        nbformat.current_nbformat_minor
    )
    ```

[^2]: The extra prefix tells local tmux to send the command through to
    the server.

[^3]: In fact, it ties for sixth in the past ten weeks:
    ![](images/d6c75039891a6afce2bdf2c01f9486ba6fa51ed2.svg) `y`{.bash}
    is a wrapper for [youtube-dl](https://youtube-dl.org/), and
    `lyrics`{.bash} is a BASH script that, well, looks up song lyrics.
    To get these stats:

    ``` {.bash}
    history \
        | cut -d ' ' -f 4 \
        | sort \
        | uniq -c \
        | sort -n \
        | tail -10
    ```

[^4]: Assuming [Kerckhoffs's
    principle](https://en.wikipedia.org/wiki/Kerckhoffs%27s_principle),
    which I guess we'll have to now that I've blogged about it.
