#!/bin/bash

find ./resources/geojson -type f | while read file
do
    arr=( `echo $file | tr -s '/' ' '`)
    pref_code=${arr[3]}
    # ディレクトリ
    dir="resources/topojson/"$pref_code
    if [ ! -d $dir ]; then
      mkdir -p $dir
    fi
    basename=$(basename $file)
    name=( `echo $basename | sed -e "s/\.geojson/.topojson/"`)
    echo $dir
    echo $name
    npx topojson -o $dir/$name -q 1e4 resources/geojson/$pref_code/$basename
done