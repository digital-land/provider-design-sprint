function createGOVUKPagination( currPage, { numPages, pathBase = "/", pathEnd = "?page=", pageBuffer = 2, hrefArray = null } = {} ) {
  if (currPage == null) throw new Error("currPage is required");
  if (!hrefArray && typeof numPages !== "number") throw new Error("You must supply either numPages or hrefArray");

  currPage = Number(currPage)
  if (hrefArray) numPages = hrefArray.length;

  const paginationObj = {};

  if (currPage > 1) {
    let prevUrl = ""
    if (hrefArray) {
      prevUrl = hrefArray[currPage - 2]
    } else {
      prevUrl = pathBase + pathEnd + (currPage-1)
    }
    paginationObj.previous = {
      href: prevUrl
    }
  }

  if (currPage < numPages) {
    let nextUrl = ""
    if (hrefArray) {
      nextUrl = hrefArray[currPage]
    } else {
      nextUrl = pathBase + pathEnd + (currPage+1)
    }
    paginationObj.next = {
      href: nextUrl
    }
  }

  paginationObj.items = []
  let prevSkip = false;
  let nextSkip = false;

  for (let i=1; i<=numPages; i++) {
    let item = {};
    if (i == 1
      || (i >= currPage-pageBuffer && i <= currPage+pageBuffer)
      || i == numPages) {
      
        item.number = i;

        if (hrefArray) {
          item.href = hrefArray[i-1]
        } else {
          item.href = pathBase + pathEnd + i
        }

        if (i == currPage) {
          item.current = true;
        }

        paginationObj.items.push(item)
    }
    
    if (i > 1 && (i <= currPage-pageBuffer) && !prevSkip) {
      item.ellipsis = true;
      prevSkip = true
      paginationObj.items.push(item)
    }
    
    if (i < numPages && (i > currPage+pageBuffer) && !nextSkip) {
      item.ellipsis = true;
      nextSkip = true
      paginationObj.items.push(item)
    }
  }

  return paginationObj
}

export { createGOVUKPagination }