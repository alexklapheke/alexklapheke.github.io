-- <https://pandoc.org/lua-filters.html#counting-words-in-a-document>
-- counts words in a document

words = 0

wordcount = {
  Str = function(el)
    -- we don't count a word if it's entirely punctuation:
    if el.text:match("%P") then
        words = words + 1
    end
  end,

  Code = function(el)
    _,n = el.text:gsub("%S+","")
    words = words + n
  end,

  CodeBlock = function(el)
    _,n = el.text:gsub("%S+","")
    words = words + n
  end
}

function comma_value(n) -- credit http://richard.warburton.it
    local left,num,right = string.match(n,'^([^%d]*%d)(%d*)(.-)$')
    return left..(num:reverse():gsub('(%d%d%d)','%1,'):reverse())..right
end

function Pandoc(el)
    -- skip metadata, just count body:
    pandoc.walk_block(pandoc.Div(el.blocks), wordcount)
    -- os.exit(0)
end

function Meta(m)
    m.wordcount = comma_value(words)
    return m
end

return {
  { Pandoc = Pandoc },
  { Meta = Meta }
}
