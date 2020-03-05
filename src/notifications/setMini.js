import * as $ from 'jquery';

export default async function setMini(ContrMenu, ContrSelected, ContrGroups, cacheMiniatures) {
  const missCache = [];
  const action = $(document).find('.con-photo > img[src=\'\'][action-id]');

  if (action.exists()) {
    $.each(action, (i, it) => {
      const id = $(it).attr('action-id');
      const itemId = parseInt($(it).closest('.item-menu').attr('item'), 10);
      // const idxData = parseInt($(it).closest('.con-notif').attr('index-data'), 10);
      const panel = $(it).closest('.panel-with-menu, .panel-with-selected');
      const panelName = panel.attr('class');
      let idSelected;

      if (panelName === 'panel-with-selected') {
        idSelected = parseInt(panel.attr('group-id'), 10);
      }

      const isExists = cacheMiniatures.v.has(id);

      if (isExists) {
        $(it).attr('src', cacheMiniatures.v.get(id));

        if (panelName === 'panel-with-menu') {
          const data = ContrMenu.getData();
          data[itemId].srcMini = cacheMiniatures.v.get(id);
          ContrMenu.update(itemId, data[itemId]);
        } else if (panelName === 'panel-with-selected') {
          if (idSelected !== -1) {
            const data = ContrSelected.getData();
            data[itemId].srcMini = cacheMiniatures.v.get(id);

            const dataGroups = ContrGroups.getCurGroupsData();
            dataGroups[idSelected][itemId].srcMini = cacheMiniatures.v.get(id);
            ContrGroups.setCurGroupsData(dataGroups);

            ContrSelected.update(itemId, data[itemId]);
          }
        }
      } else {
        $(it).attr('src', '#');
        missCache.push({
          id,
          i,
          itemId,
          panel: panelName,
          idSelected,
        });
      }
    });

    if (missCache.length) {
      const step = 30;

      for (let index = 0; index < missCache.length; index += step) {
        const result = await Promise.all(missCache.slice(index, index + step)
          // eslint-disable-next-line no-loop-func
          .map(it => setUrlImgPost(it, cacheMiniatures).then((url) => {
            if (url !== 0) {
              if (it.panel === 'panel-with-menu') {
                const data = ContrMenu.getData();
                data[it.itemId].srcMini = url;
                ContrMenu.update(it.itemId, data[it.itemId]);
              } else if (it.panel === 'panel-with-selected') {
                if (it.idSelected !== -1) {
                  const data = ContrSelected.getData();
                  data[it.itemId].srcMini = cacheMiniatures.v.get(it.id);

                  const dataGroups = ContrGroups.getCurGroupsData();
                  dataGroups[it.idSelected][it.itemId].srcMini = cacheMiniatures.v.get(it.id);
                  ContrGroups.setCurGroupsData(dataGroups);

                  if (ContrGroups.getCurSelectedGroupId().id === it.idSelected) {
                    ContrSelected.update(it.itemId, data[it.itemId]);
                  }
                }
              }
            }

            return true;
          }).catch(e => e))).catch(e => e.statusText);
      }
    }
  }
}

async function setUrlImgPost(item, cacheMiniatures) {
  const { id } = item;
  const post = await getResBc({
    url: `https://www.belacam.com/api/post/${id}/`,
    type: 'GET',
    dataType: 'json',
  });

  if (post.count) {
    const src = post.results[0].image;
    cacheMiniatures.set(id, src);
    return src;
  }

  return 0;
}

// !!! duplication from GroupsController
async function getResBc(obj) {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: 'https://www.belacam.com/*' }, (tabs) => {
      // console.log(tabs, obj);
      if (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { greeting: obj }, (res) => {
          resolve(res);
        });
      }
    });
  });
}
