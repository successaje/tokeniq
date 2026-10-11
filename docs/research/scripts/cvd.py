import itertools, math
M={'normal':[[1,0,0],[0,1,0],[0,0,1]],
 'protan':[[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]],
 'deutan':[[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]],
 'tritan':[[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.303900]]}
def lin(c): return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def hex2lin(h): h=h.lstrip('#'); return [lin(int(h[i:i+2],16)/255) for i in (0,2,4)]
def lab(rgb):
    r,g,b=[min(max(x,0),1) for x in rgb]
    X=0.4124*r+0.3576*g+0.1805*b; Y=0.2126*r+0.7152*g+0.0722*b; Z=0.0193*r+0.1192*g+0.9505*b
    Xn,Yn,Zn=0.95047,1.0,1.08883
    f=lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    fx,fy,fz=f(X/Xn),f(Y/Yn),f(Z/Zn)
    return (116*fy-16, 500*(fx-fy), 200*(fy-fz))
def sim(h,m): v=hex2lin(h); return [sum(M[m][i][j]*v[j] for j in range(3)) for i in range(3)]
def de(a,b): return math.dist(a,b)
sets={
 'A light (reserve/oblig/surplus)':['#2D3A40','#B07018','#0E6470'],
 'A dark':['#8C9AA1','#D9A441','#5CBAC6'],
 'B light':['#1F3F6B','#A0522D','#3D6B5A'],
 'B dark':['#9DB8E3','#D98E63','#86BFA9'],
 'C dark':['#4A6684','#7E9AB6','#D2A857'],
 'C light':['#2F4A63','#6A879F','#B07F22'],
}
names=['reserve','oblig','surplus']
for k,cols in sets.items():
    out=[]
    for m in M:
        labs=[lab(sim(c,m)) for c in cols]
        mn=min(de(labs[i],labs[j]) for i,j in itertools.combinations(range(3),2))
        pair=min(itertools.combinations(range(3),2), key=lambda p: de(labs[p[0]],labs[p[1]]))
        out.append(f"{m}:{mn:5.1f}({names[pair[0]][0]}-{names[pair[1]][0]})")
    print(f"{k:<34}", '  '.join(out))
