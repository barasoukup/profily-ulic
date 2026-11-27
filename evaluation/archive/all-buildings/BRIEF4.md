# Judging house drawings against street photos
Each sheet <id>.jpg has, left to right: a street photo, then two or three drawings, numbered 1, 2, 3 from the left (a red "A" in the drawings is part of the scenery, not a label). The house in question is the one in the MIDDLE of the photo, nearest to the camera. The drawings show a generic house type from the side (we look along the street, the street is on the right, so balconies, bays and porches stick out to the right; facade windows and the door are drawn on the side wall by artistic licence). Ignore exact colour, small details and the figures. Judge the TYPE: kind and era of the building (old town house or tenement, interwar, post-war block of flats, modern block, office, villa, shop or hall, garage…), storeys, roof form, front (balconies, bay, plain), material.
Read every image of your list yourself, one by one. For each sheet:
- "r": for each drawing, in order, one of "right" (type right, storeys within one), "partly" (general kind right but a main thing wrong), "wrong".
- "best": the number of the drawing nearest to the real house, or "same" (no real difference in fit), or "unclear" (the photo does not show the house, or it is hidden, or you cannot tell which house is meant).
- "rank": the drawings from best to worst, "=" for equal, e.g. "2>1", "1=2", "3>1=2"; "" if unclear.
- "type": 3-8 words what the house really is (era, storeys, roof).
There is no expected answer. Do not read any other file than the images and this one.
Write strict JSON to the file named in your task: {"<id>": {"r": ["wrong","partly"], "best": "2", "rank": "2>1", "type": "..."}, ...} and reply with one line only.
