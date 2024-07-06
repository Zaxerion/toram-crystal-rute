NV.component(

  class Main extends Nirvana {

    parser = new DOMParser();
    crystal = NV.store("Crystal");
    crystalType = NV.store("Crystal.type");
    crystalIcon = NV.store("Crystal.icon");

    linked = [];
    upgrade = [];
    downgrade = [];

    leaderLineOption = {
      dash: true,
      startPlug: "arrow2",
      endPlug: "disc",
      startSocket: 'left',
      endSocket: 'bottom',
      showEffectName: "draw",
      color: "rgba(0,0,0,0.25)",
      size: 2.5
    }

    start() {
      window.leaderLine = [];
    }

    search(event) {
      try {
        const nameInput = this.select("input[name='name']").item(0);
        const name = nameInput.value.trim();
        if (name.length >= 3) {
          setTimeout(() => {
            this.searchProcess(name);
          }, 500);
        } else {
          this.select("#output").item(0).innerHTML = '<p>Minimal 3 huruf Crystall.</p>';
        }
      } catch (e) {
        console.log(e);
      }

      event.preventDefault();
    }

    searchAgain(name) {
      this.searchProcess(name);
    }

    async searchProcess(name) {
      try {
        const output = this.select("#output").item(0);
        output.innerHTML = '';
        const outputUp = this.select("#output-up").item(0);
        outputUp.innerHTML = '';
        const outputDown = this.select("#output-down").item(0);
        outputDown.innerHTML = '';

        const foundCrystals = [];

        this.crystal.forEach(data => {
          const crystalName = data.get("name").toLowerCase();
          if (crystalName.includes(name.toLowerCase())) {
            foundCrystals.push(data);
          }
        });

        if (foundCrystals.length > 0) {
          const mainCrystal = foundCrystals.find(crystal => crystal.get("name").toLowerCase() === name.toLowerCase());

          if (mainCrystal) {
            const similarCrystals = foundCrystals.filter(crystal =>
              crystal.get("name").toLowerCase() !== mainCrystal.get("name").toLowerCase()
            );

            await this.getUpgrade(mainCrystal.get("code"));
            this.upgrade.forEach(upRow => {
              let stepBox = '<li class="mb-5">';
              upRow.forEach(crystal => {
                stepBox += this.card(crystal, true);
              });
              stepBox += '</li>';
              outputUp.appendChild(this.node(stepBox));
            });

            if (mainCrystal.get("link")) {
              await this.getDowngrade(mainCrystal.get("link"));
              this.downgrade.forEach(crystal => {
                let stepBox = '<li class="mb-5">';
                stepBox += this.card(crystal, true);
                stepBox += '</li>';
                outputDown.appendChild(this.node(stepBox));
              });
            }

            const linkedCrystals = new Set();
            this.collectLinkedCrystals(mainCrystal, linkedCrystals);
            output.appendChild(this.card(mainCrystal));
            let filteredSimilarCrystals = similarCrystals.filter(crystal => !linkedCrystals.has(crystal));
            filteredSimilarCrystals.sort((a, b) => a.get("name").localeCompare(b.get("name")));
            filteredSimilarCrystals.forEach(crystal => {
              output.appendChild(this.card(crystal));
            });
          } else {
            foundCrystals.sort((a, b) => a.get("name").localeCompare(b.get("name")));
            foundCrystals.forEach(crystal => {
              output.appendChild(this.card(crystal));
            });
          }

          setTimeout(() => {
            this.link();
          });
        } else {
          output.innerHTML = '<p>No results found.</p>';
        }
      } catch (e) {
        console.error(e);
      }
    }

    collectLinkedCrystals(crystal, linkedCrystals) {
      this.crystal.forEach(data => {
        if (data.get("link") === crystal.get("code")) {
          if (!linkedCrystals.has(data)) {
            linkedCrystals.add(data);
            this.collectLinkedCrystals(data, linkedCrystals);
          }
        }
        if (crystal.get("link") && data.get("code") === crystal.get("link")) {
          if (!linkedCrystals.has(data)) {
            linkedCrystals.add(data);
            this.collectLinkedCrystals(data, linkedCrystals);
          }
        }
      });
    }


    isLinkedCrystalDisplayedInOutput(mainCrystal, similarCrystal) {
      const mainCrystalElement = this.select(`#crystal-${mainCrystal.get("code")}`).item(0);
      const similarCrystalElement = this.select(`#crystal-${similarCrystal.get("link")}`).item(0);
      const outputContainer = this.select("#output").item(0);

      return (
        mainCrystalElement &&
        similarCrystalElement &&
        outputContainer.contains(mainCrystalElement) &&
        outputContainer.contains(similarCrystalElement)
      );
    }

    link() {
      if (window.leaderLine.length !== 0) {
        window.leaderLine.forEach(line => {
          line.remove();
        });
        window.leaderLine = [];
      }

      this.select(".card").forEach(element => {
        if (this.select(element.getAttribute("link")).item(0)) {
          if (!this.isInSameOutputContainer(element, element.getAttribute("link"))) {
            window.leaderLine.push(new LeaderLine(
              element,
              this.select(element.getAttribute("link")).item(0),
              this.leaderLineOption
            ));
          }
        }
      });
    }

    isInSameOutputContainer(element1, linkSelector) {
      const outputContainer = this.select("#output").item(0);
      const linkedElement = this.select(linkSelector).item(0);
      return outputContainer.contains(element1) && outputContainer.contains(linkedElement);
    }


    card(crystal, asString = false) {
      let element = `
      <div id="crystal-${crystal.get("code")}" link="#crystal-${crystal.get("link")}" class="card mb-2">
        <img src="${this.crystalIcon.get(crystal.get("type"))}" alt="icon" width="20px" class="m-1 rounded">
        <div>
          <div class="d-flex align-items-center">
            <h6 class="m-0">${crystal.get("name")}</h6>
            <button onclick="NV.run('Main').searchAgain('${crystal.get("name")}')" class="btn btn-sm">🔎</button>
          </div>
          <small class="text-secondary">${crystal.get("type")}</small>
          <div class="m-0 small">
            ${crystal.get("view").replaceAll('\n', '<br>')}
          </div>
        </div>
      </div>
      `;
      if (asString) {
        return element;
      } else {
        return this.node(element);
      }
    }


    async getUpgrade(code) {
      await this.findAll(this.crystal, "link", code).then(upgrade => {
        if (upgrade.size) {
          upgrade.forEach(data => {
            this.getUpgrade(data.get("code"));
          });
          this.upgrade.push(upgrade);
        }
      });
    }

    async getDowngrade(link) {
      await this.findOne(this.crystal, "code", link).then(downgrade => {
        if (typeof downgrade !== 'undefined') {
          this.getDowngrade(downgrade.get("link"));
          this.downgrade.push(downgrade);
        }
      });
    }

    node(string) {
      return this.parser.parseFromString(string, 'text/html').body.firstChild;
    }

    findOne(fromThis, byKey, sameAs) {
      return new Promise((resolve, reject) => {
        let result;
        for (let i = 0; i < fromThis.size; i++) {
          if (fromThis.get(i.toString()).get(byKey) == sameAs) {
            result = fromThis.get(i.toString());
          }
        }
        resolve(result);
      });
    }

    findAll(fromThis, byKey, sameAs) {
      return new Promise((resolve, reject) => {
        let result = new Map();
        for (let i = 0; i < fromThis.size; i++) {
          if (fromThis.get(i.toString()).get(byKey) == sameAs) {
            result.set(i.toString(), fromThis.get(i.toString()));
          }
        }
        resolve(result);
      });
    }

  }
);

NV.run("Main").start();