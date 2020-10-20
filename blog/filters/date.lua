function Meta(m)
    date = m.date
    m.date_iso = os.date("%Y-%m-%dT%H:%M:%S%z", date)  -- 2020-06-22T06:10:59-0400
    m.date_rfc = os.date("%a, %d %b %Y %T %z", date)  -- Mon, 22 Jun 2020 06:10:59 -0400
    m.date_pretty = os.date("%A, %B %e, %Y", date) -- Monday, June 22, 2020
    m.date_terse = os.date("%F", date)             -- 2020-06-22
    return m
end
